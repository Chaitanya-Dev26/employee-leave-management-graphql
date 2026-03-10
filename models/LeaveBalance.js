class LeaveBalance {
    constructor(db) {
        this.db = db;
    }

    async findByEmployee(employeeId) {
        return await this.db.all('SELECT * FROM LeaveBalance WHERE employee_id = ?', [employeeId]);
    }

    async findByEmployeeAndType(employeeId, leaveTypeId) {
        return await this.db.get('SELECT * FROM LeaveBalance WHERE employee_id = ? AND leave_type_id = ?', [employeeId, leaveTypeId]);
    }

    async updateBalance(employeeId, leaveTypeId, days) {
        await this.db.run(
            'UPDATE LeaveBalance SET remaining_days = remaining_days - ? WHERE employee_id = ? AND leave_type_id = ?',
            [days, employeeId, leaveTypeId]
        );
    }
}

module.exports = LeaveBalance;
