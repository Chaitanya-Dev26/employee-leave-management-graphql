// 1. Imports: We pull in our "Blueprints" (Models) so the Resolvers know how to talk to the database.
const Employee = require('./models/Employee');
const LeaveType = require('./models/LeaveType');
const LeaveBalance = require('./models/LeaveBalance');
const LeaveRequest = require('./models/LeaveRequest');
const Approval = require('./models/Approval');

// 2. The Resolvers: Think of this as the "Butler" of your app. 
// When the frontend asks for data, the Butler goes to the database and gets it.
const resolvers = {
    // Queries are for GETTING data (View-only).
    Query: {
        // Find one specific employee using their ID number.
        employee: async (_, { id }) => {
            return await Employee.findOne({ id: Number(id) });
        },
        // Get a list of everyone who works at the company.
        allEmployees: async () => {
            return await Employee.find({});
        },
        // Get only the leave requests that are waiting for a decision.
        pendingLeaves: async () => {
            return await LeaveRequest.find({ status: 'pending' });
        },
        // Get ALL leave requests ever made, showing the newest ones first.
        allLeaves: async () => {
            return await LeaveRequest.find({}).sort({ applied_at: -1 });
        },
        // Get the list of leave types (Sick, Annual, Casual).
        leaveTypes: async () => {
            return await LeaveType.find({});
        }
    },

    // These sections help GraphQL connect related data together automatically.
    Employee: {
        // When looking at an Employee, also find their specific leave balances.
        leaveBalances: async (parent) => {
            return await LeaveBalance.find({ employee_id: parent.id });
        },
        // Also find all the leave requests this specific employee has made.
        leaveRequests: async (parent) => {
            return await LeaveRequest.find({ employee_id: parent.id }).sort({ applied_at: -1 });
        }
    },

    LeaveBalance: {
        // Rename 'remaining_days' from the database to 'remainingDays' for the frontend.
        remainingDays: (parent) => parent.remaining_days,
        // Find the name and details of the leave type for this balance.
        leaveType: async (parent) => {
            return await LeaveType.findOne({ id: parent.leave_type_id });
        }
    },

    LeaveRequest: {
        // Match up the database date names with the frontend names.
        startDate: (parent) => parent.start_date,
        endDate: (parent) => parent.end_date,
        // Find the full details of the employee who made this request.
        employee: async (parent) => {
            return await Employee.findOne({ id: parent.employee_id });
        },
        // Find what kind of leave they are asking for.
        leaveType: async (parent) => {
            return await LeaveType.findOne({ id: parent.leave_type_id });
        },
        // If the leave was approved, find out which Manager did it.
        approvedBy: async (parent) => {
            const approval = await Approval.findOne({ leave_request_id: parent.id, status: 'approved' });
            if (!approval) return null;
            return await Employee.findOne({ id: approval.manager_id });
        }
    },

    // Mutations are for CHANGING data (Adding, Updating, Deleting).
    Mutation: {
        // This is called when an employee clicks "Submit" on a leave form.
        createLeaveRequest: async (_, { employeeId, leaveTypeId, startDate, endDate, reason }) => {

            // Step A: Check if the employee already has a leave booked for these dates.
            const overlap = await LeaveRequest.findOne({
                employee_id: Number(employeeId),
                status: { $nin: ['rejected', 'cancelled'] },
                $or: [
                    { start_date: { $lte: startDate }, end_date: { $gte: startDate } },
                    { start_date: { $lte: endDate }, end_date: { $gte: endDate } },
                    { start_date: { $gte: startDate }, end_date: { $lte: endDate } }
                ]
            });
            if (overlap) throw new Error('You already have a leave request for these dates!');

            // Step B: Check if they have enough days left in their balance.
            const balance = await LeaveBalance.findOne({
                employee_id: Number(employeeId),
                leave_type_id: Number(leaveTypeId)
            });
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            if (!balance || balance.remaining_days < days) {
                throw new Error('You do not have enough leave days left!');
            }

            // Step C: Give this new request a unique number (ID).
            const lastRequest = await LeaveRequest.findOne({}).sort({ id: -1 });
            const newId = lastRequest ? lastRequest.id + 1 : 1;

            // Step D: Save the request to the database.
            const newRequest = new LeaveRequest({
                id: newId,
                employee_id: Number(employeeId),
                leave_type_id: Number(leaveTypeId),
                start_date: startDate,
                end_date: endDate,
                reason,
                status: 'pending'
            });
            await newRequest.save();
            return newRequest;
        },

        // This is called when a Manager clicks "Approve" or "Reject".
        approveLeave: async (_, { id, status, managerId, remarks }) => {
            // Check if the person clicking the button is actually a Manager.
            const mid = managerId ? Number(managerId) : 1;
            const manager = await Employee.findOne({ id: mid });
            if (!manager || manager.role !== 'manager') {
                throw new Error('Only managers are allowed to do this!');
            }

            // Find the request by its ID number.
            const request = await LeaveRequest.findOne({ id: Number(id) });
            if (!request) throw new Error('We could not find that leave request.');
            if (request.status !== 'pending') throw new Error('This request has already been decided.');

            // Step A: Update the request to say 'approved' or 'rejected'.
            request.status = status;
            await request.save();

            // Step B: Record who made the decision.
            const lastApproval = await Approval.findOne({}).sort({ id: -1 });
            const newAppId = lastApproval ? lastApproval.id + 1 : 1;
            const newApproval = new Approval({
                id: newAppId,
                leave_request_id: Number(id),
                manager_id: mid,
                status,
                remarks
            });
            await newApproval.save();

            // STEP C: If the leave request is approved, subtract the number of leave days
            // from the employee's remaining leave balance.

            // JavaScript stores dates internally as a number representing how many
            // milliseconds have passed since January 1, 1970 00:00:00 UTC.
            // This reference point is called the "Unix Epoch".

            // Why 1970?
            // When the Unix operating system was developed at Bell Labs in the late 1960s,
            // engineers needed a simple way to represent time in computers. Instead of
            // storing dates as text like "Apr 10 2024", they decided to store time as a
            // numeric counter starting from a fixed reference point. They chose
            // January 1, 1970 as that starting point. This system became a global standard
            // and is now used by many programming languages, databases, and operating systems.

            // Because dates are stored as numbers internally, when we subtract two Date
            // objects in JavaScript (end - start), the engine subtracts their underlying
            // millisecond values.
            
            // Example:
            // start_date = "2024-04-10"
            // end_date   = "2024-04-12"
            //
            // Internally JavaScript converts them to something like:
            // Apr 10 → 1712707200000 ms
            // Apr 12 → 1712880000000 ms
            //
            // Difference:
            // 1712880000000 - 1712707200000 = 172800000 milliseconds
            //
            // To convert milliseconds into days we divide by the number of milliseconds in one day:
            // 1 day = 1000 ms * 60 sec * 60 min * 24 hr = 86,400,000 ms
            //
            // 172800000 / 86400000 = 2 days difference

            // (end - start) / 86400000 → gives the difference in days.

            // We use Math.ceil() to round up to avoid fractional day issues.
            // Finally we add +1 because leave requests are inclusive.
            // Example: Apr 10 → Apr 12 counts as 3 days (10, 11, 12).

            // After calculating the number of days, we subtract it from the employee's
            // remaining leave balance using MongoDB's $inc operator.
            if (status === 'approved') {
                const start = new Date(request.start_date);
                const end = new Date(request.end_date);
                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

                await LeaveBalance.updateOne(
                    { employee_id: request.employee_id, leave_type_id: request.leave_type_id },
                    { $inc: { remaining_days: -days } }
                );
            }

            return request;
        }
    }
};

module.exports = resolvers;
