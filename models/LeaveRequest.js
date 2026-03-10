class LeaveRequest {
    constructor(db) {
        this.db = db;
    }

    async create(data) {
        const { employeeId, leaveTypeId, startDate, endDate, reason } = data;
        const result = await this.db.run(
            'INSERT INTO LeaveRequest (employee_id, leave_type_id, start_date, end_date, reason) VALUES (?, ?, ?, ?, ?)',
            [employeeId, leaveTypeId, startDate, endDate, reason]
        );
        return await this.findById(result.lastID);
    }

    async findById(id) {
        return await this.db.get('SELECT * FROM LeaveRequest WHERE id = ?', [id]);
    }

    async findPending() {
        return await this.db.all('SELECT * FROM LeaveRequest WHERE status = "pending"');
    }

    async updateStatus(id, status) {
        await this.db.run('UPDATE LeaveRequest SET status = ? WHERE id = ?', [status, id]);
        return await this.findById(id);
    }

    async checkOverlap(employeeId, startDate, endDate) {
        const overlap = await this.db.get(
            `SELECT * FROM LeaveRequest 
             WHERE employee_id = ? 
             AND status NOT IN ('rejected', 'cancelled')
             AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?) OR (? <= start_date AND ? >= end_date))`,
            [employeeId, startDate, startDate, endDate, endDate, startDate, endDate]
        );
        return overlap;
    }
}

module.exports = LeaveRequest;
