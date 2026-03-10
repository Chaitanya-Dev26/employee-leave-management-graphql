class Approval {
    constructor(db) {
        this.db = db;
    }

    async create(data) {
        const { leaveRequestId, managerId, status, remarks } = data;
        const result = await this.db.run(
            'INSERT INTO Approval (leave_request_id, manager_id, status, remarks) VALUES (?, ?, ?, ?)',
            [leaveRequestId, managerId, status, remarks]
        );
        return result.lastID;
    }

    async findByRequest(leaveRequestId) {
        return await this.db.get('SELECT * FROM Approval WHERE leave_request_id = ?', [leaveRequestId]);
    }
}

module.exports = Approval;
