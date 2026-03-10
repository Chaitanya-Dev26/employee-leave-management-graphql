const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function setupDb() {
    const db = await open({
        filename: path.join(__dirname, 'database.sqlite'),
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS Employee (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            department TEXT,
            designation TEXT,
            joining_date TEXT,
            role TEXT CHECK(role IN ('employee', 'manager')) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS LeaveType (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            max_days_per_year INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS LeaveBalance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            leave_type_id INTEGER NOT NULL,
            remaining_days INTEGER NOT NULL,
            FOREIGN KEY (employee_id) REFERENCES Employee(id),
            FOREIGN KEY (leave_type_id) REFERENCES LeaveType(id)
        );

        CREATE TABLE IF NOT EXISTS LeaveRequest (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            leave_type_id INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            reason TEXT,
            status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES Employee(id),
            FOREIGN KEY (leave_type_id) REFERENCES LeaveType(id)
        );

        CREATE TABLE IF NOT EXISTS Approval (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            leave_request_id INTEGER NOT NULL,
            manager_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            remarks TEXT,
            approved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (leave_request_id) REFERENCES LeaveRequest(id),
            FOREIGN KEY (manager_id) REFERENCES Employee(id)
        );
    `);

    // Seed initial data if empty
    const employeeCount = await db.get('SELECT COUNT(*) as count FROM Employee');
    if (employeeCount.count === 0) {
        await db.run('INSERT INTO Employee (name, email, department, designation, role) VALUES (?, ?, ?, ?, ?)',
            ['Alice Manager', 'alice@company.com', 'HR', 'HR Manager', 'manager']);
        await db.run('INSERT INTO Employee (name, email, department, designation, role) VALUES (?, ?, ?, ?, ?)',
            ['Bob Employee', 'bob@company.com', 'Engineering', 'Software Engineer', 'employee']);
        await db.run('INSERT INTO Employee (name, email, department, designation, role) VALUES (?, ?, ?, ?, ?)',
            ['Charlie Dev', 'charlie@company.com', 'Engineering', 'Junior Developer', 'employee']);

        await db.run('INSERT INTO LeaveType (name, max_days_per_year) VALUES (?, ?)', ['Annual Leave', 20]);
        await db.run('INSERT INTO LeaveType (name, max_days_per_year) VALUES (?, ?)', ['Sick Leave', 10]);
        await db.run('INSERT INTO LeaveType (name, max_days_per_year) VALUES (?, ?)', ['Casual Leave', 12]);

        const employees = [1, 2, 3];
        const types = [1, 2, 3];
        const limits = { 1: 20, 2: 10, 3: 12 };

        for (const empId of employees) {
            for (const typeId of types) {
                await db.run('INSERT INTO LeaveBalance (employee_id, leave_type_id, remaining_days) VALUES (?, ?, ?)',
                    [empId, typeId, limits[typeId]]);
            }
        }
    }

    return db;
}

module.exports = { setupDb };
