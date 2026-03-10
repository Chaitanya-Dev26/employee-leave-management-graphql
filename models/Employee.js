class Employee {
    constructor(db) {
        this.db = db;
    }

    async findById(id) {
        return await this.db.get('SELECT * FROM Employee WHERE id = ?', [id]);
    }

    async findAll() {
        return await this.db.all('SELECT * FROM Employee');
    }

    async findRole(id) {
        const emp = await this.findById(id);
        return emp ? emp.role : null;
    }
}

module.exports = Employee;
