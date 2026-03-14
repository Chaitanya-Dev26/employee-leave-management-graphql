// 1. Imports: We bring in Mongoose (the MongoDB driver) and the models we created.
const mongoose = require('mongoose'); 
const Employee = require('../models/Employee');
const LeaveType = require('../models/LeaveType');
const LeaveBalance = require('../models/LeaveBalance');

// 2. Main Setup Function: This is called when the server starts.
async function setupDb() {
    // This is the address of your database on your local machine.
    const mongoURI = 'mongodb://localhost:27017/employee_leave_management';
    
    try {
        // 3. Connection: We tell Mongoose to connect to the MongoDB server.
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // 4. Seeding Check: We check if the 'Employee' collection has any records.
        const employeeCount = await Employee.countDocuments();
        
        // If the database is brand new (count is 0), we fill it with starting data.
        if (employeeCount === 0) {
            console.log('Seeding initial data...');
            
            // 5. Insert Employees: We create our first 3 users (1 Manager, 2 Employees).
            await Employee.insertMany([
                { id: 1, name: 'Alice Manager', email: 'alice@company.com', department: 'HR', designation: 'HR Manager', role: 'manager' },
                { id: 2, name: 'Bob Employee', email: 'bob@company.com', department: 'Engineering', designation: 'Software Engineer', role: 'employee' },
                { id: 3, name: 'Charlie Dev', email: 'charlie@company.com', department: 'Engineering', designation: 'Junior Developer', role: 'employee' }
            ]);

            // 6. Insert Leave Types: We define the types of leave available in the system.
            await LeaveType.insertMany([
                { id: 1, name: 'Annual Leave', max_days_per_year: 20 },
                { id: 2, name: 'Sick Leave', max_days_per_year: 10 },
                { id: 3, name: 'Casual Leave', max_days_per_year: 12 }
            ]);

            // 7. Generate Leave Balances: 
            // We need to give every employee a balance for every leave type.
            const employees = [1, 2, 3];
            const types = [
                { id: 1, limit: 20 },
                { id: 2, limit: 10 },
                { id: 3, limit: 12 }
            ];

            let balanceId = 1;
            const balances = [];
            
            // This nested loop creates a balance record for every combination 
            // (e.g., Alice's Annual Leave, Alice's Sick Leave, etc.)
            for (const empId of employees) {
                for (const type of types) {
                    balances.push({
                        id: balanceId++,
                        employee_id: empId,
                        leave_type_id: type.id,
                        remaining_days: type.limit // Set initial balance to the maximum allowed
                    });
                }
            }
            // Save all generated balances at once for efficiency.
            await LeaveBalance.insertMany(balances);
            console.log('Seeding complete.');
        }

        return mongoose.connection;
    } catch (err) {
        // 8. Error Handling: If MongoDB isn't running, the server won't start.
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

// 9. Export: We share this function so 'server.js' can use it.
module.exports = { setupDb };