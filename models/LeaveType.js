class LeaveType {
    constructor(db) {
        this.db = db;
    }

    async findById(id) {
        return await this.db.get('SELECT * FROM LeaveType WHERE id = ?', [id]);
    }

    async findAll() {
        return await this.db.all('SELECT * FROM LeaveType');
    }
}

module.exports = LeaveType;
