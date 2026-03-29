// 1. Imports: We bring in Mongoose (the MongoDB driver) and the models we created.
const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const LeaveType = require('../models/LeaveType');
const LeaveBalance = require('../models/LeaveBalance');

// 2. Main Setup Function: This is called when the server starts.
async function setupDb() {
    const mongoURI = process.env.MONGODB_URI;

    // ──────────────────────────────────────────────────────────────────
    // SECURITY CHECK: In production, MONGODB_URI *must* be set.
    // This prevents accidentally running against an open localhost DB.
    // ──────────────────────────────────────────────────────────────────
    if (!mongoURI) {
        if (process.env.NODE_ENV === 'production') {
            console.error('❌ MONGODB_URI is not set! Cannot start in production without a secure database.');
            process.exit(1);
        }
        // In development, fall back to localhost (for convenience).
        console.warn('⚠️  MONGODB_URI not set — falling back to localhost (dev mode only).');
    }

    const connectionString = mongoURI || 'mongodb://localhost:27017/employee_leave_management';

    try {
        // ──────────────────────────────────────────────────────────────
        // 3. Connection Options (production-grade):
        //
        //   maxPoolSize     → Max 10 simultaneous connections (prevents overload)
        //   minPoolSize     → Keep 2 connections warm (faster response times)
        //   serverSelectionTimeoutMS → Give up after 5s if DB is unreachable
        //   socketTimeoutMS → Kill idle sockets after 45s
        //   heartbeatFrequencyMS → Check DB health every 10s
        //   retryWrites     → Auto-retry failed writes (network blips)
        //   retryReads      → Auto-retry failed reads
        //   w: 'majority'   → Write is only confirmed after majority of replicas acknowledge
        // ──────────────────────────────────────────────────────────────
        await mongoose.connect(connectionString, {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            heartbeatFrequencyMS: 10000,
            retryWrites: true,
            retryReads: true,
            w: 'majority',
        });

        console.log(`✅ Connected to MongoDB (${process.env.NODE_ENV || 'development'} mode)`);

        // ──────────────────────────────────────────────────────────────
        // 4. Connection Event Listeners:
        //    These help you monitor the health of your database in production.
        // ──────────────────────────────────────────────────────────────
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Mongoose will attempt to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected successfully.');
        });

        // ──────────────────────────────────────────────────────────────
        // 5. Graceful Shutdown:
        //    When you press Ctrl+C or the server is stopped (e.g. by Vercel),
        //    we close the database connection cleanly instead of just killing it.
        // ──────────────────────────────────────────────────────────────
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 ${signal} received. Closing MongoDB connection...`);
            await mongoose.connection.close();
            console.log('👋 MongoDB connection closed. Goodbye!');
            process.exit(0);
        };

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Server stop

        // ──────────────────────────────────────────────────────────────
        // 6. Seeding Check: We check if the 'Employee' collection has any records.
        // ──────────────────────────────────────────────────────────────
        const employeeCount = await Employee.countDocuments();

        // If the database is brand new (count is 0), we fill it with starting data.
        if (employeeCount === 0) {
            console.log('📦 Seeding initial data...');

            // 7. Insert Employees: We create our first 3 users (1 Manager, 2 Employees).
            await Employee.insertMany([
                { id: 1, name: 'Alice Manager', email: 'alice@company.com', department: 'HR', designation: 'HR Manager', role: 'manager' },
                { id: 2, name: 'Bob Employee', email: 'bob@company.com', department: 'Engineering', designation: 'Software Engineer', role: 'employee' },
                { id: 3, name: 'Charlie Dev', email: 'charlie@company.com', department: 'Engineering', designation: 'Junior Developer', role: 'employee' }
            ]);

            // 8. Insert Leave Types: We define the types of leave available in the system.
            await LeaveType.insertMany([
                { id: 1, name: 'Annual Leave', max_days_per_year: 20 },
                { id: 2, name: 'Sick Leave', max_days_per_year: 10 },
                { id: 3, name: 'Casual Leave', max_days_per_year: 12 }
            ]);

            // 9. Generate Leave Balances:
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
            console.log('✅ Seeding complete.');
        }

        return mongoose.connection;
    } catch (err) {
        // 10. Error Handling: If MongoDB isn't running, the server won't start.
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }
}

// 11. Export: We share this function so 'server.js' can use it.
module.exports = { setupDb };