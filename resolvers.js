const Employee = require('./models/Employee');
const LeaveType = require('./models/LeaveType');
const LeaveBalance = require('./models/LeaveBalance');
const LeaveRequest = require('./models/LeaveRequest');
const Approval = require('./models/Approval');

const resolvers = {
    Query: {
        employee: async (_, { id }, { db }) => {
            const empModel = new Employee(db);
            return await empModel.findById(id);
        },
        allEmployees: async (_, __, { db }) => {
            const empModel = new Employee(db);
            return await empModel.findAll();
        },
        pendingLeaves: async (_, __, { db }) => {
            const lrModel = new LeaveRequest(db);
            return await lrModel.findPending();
        },
        allLeaves: async (_, __, { db }) => {
            const lrModel = new LeaveRequest(db);
            return await db.all('SELECT * FROM LeaveRequest ORDER BY applied_at DESC');
        },
        leaveTypes: async (_, __, { db }) => {
            const ltModel = new LeaveType(db);
            return await ltModel.findAll();
        }
    },
    Employee: {
        leaveBalances: async (parent, _, { db }) => {
            const lbModel = new LeaveBalance(db);
            return await lbModel.findByEmployee(parent.id);
        },
        leaveRequests: async (parent, _, { db }) => {
            return await db.all('SELECT * FROM LeaveRequest WHERE employee_id = ? ORDER BY applied_at DESC', [parent.id]);
        }
    },
    LeaveBalance: {
        remainingDays: (parent) => parent.remaining_days,
        leaveType: async (parent, _, { db }) => {
            const ltModel = new LeaveType(db);
            return await ltModel.findById(parent.leave_type_id);
        }
    },
    LeaveRequest: {
        startDate: (parent) => parent.start_date,
        endDate: (parent) => parent.end_date,
        employee: async (parent, _, { db }) => {
            const empModel = new Employee(db);
            return await empModel.findById(parent.employee_id);
        },
        leaveType: async (parent, _, { db }) => {
            const ltModel = new LeaveType(db);
            return await ltModel.findById(parent.leave_type_id);
        },
        approvedBy: async (parent, _, { db }) => {
            const approval = await db.get('SELECT * FROM Approval WHERE leave_request_id = ? AND status = "approved"', [parent.id]);
            if (!approval) return null;
            const empModel = new Employee(db);
            return await empModel.findById(approval.manager_id);
        }
    },
    Mutation: {
        createLeaveRequest: async (_, { employeeId, leaveTypeId, startDate, endDate, reason }, { db }) => {
            const lrModel = new LeaveRequest(db);
            const lbModel = new LeaveBalance(db);

            const overlap = await lrModel.checkOverlap(employeeId, startDate, endDate);
            if (overlap) throw new Error('Overlapping leave request already exists.');

            const balance = await lbModel.findByEmployeeAndType(employeeId, leaveTypeId);
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            if (!balance || balance.remaining_days < days) throw new Error('Insufficient leave balance.');

            return await lrModel.create({ employeeId, leaveTypeId, startDate, endDate, reason });
        },
        approveLeave: async (_, { id, status, managerId, remarks }, { db }) => {
            const empModel = new Employee(db);
            const lrModel = new LeaveRequest(db);
            const lbModel = new LeaveBalance(db);
            const appModel = new Approval(db);

            // Default managerId to 1 if not provided (for simplicity in UI as per prompt)
            const mid = managerId || 1;
            const manager = await empModel.findById(mid);
            if (!manager || manager.role !== 'manager') throw new Error('Only managers can approve leave requests.');

            const request = await lrModel.findById(id);
            if (!request) throw new Error('Leave request not found.');
            if (request.status !== 'pending') throw new Error('Leave request is already processed.');

            const updatedRequest = await lrModel.updateStatus(id, status);
            await appModel.create({ leaveRequestId: id, managerId: mid, status, remarks });

            if (status === 'approved') {
                const start = new Date(request.start_date);
                const end = new Date(request.end_date);
                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                await lbModel.updateBalance(request.employee_id, request.leave_type_id, days);
            }

            return updatedRequest;
        }
    }
};

module.exports = resolvers;
