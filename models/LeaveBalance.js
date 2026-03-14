// 1. Import Mongoose: This library handles our connection to the database.
const mongoose = require('mongoose');

// 2. The Blueprint (Schema): This tracks how many days someone has LEFT to take.
const leaveBalanceSchema = new mongoose.Schema({
    // A unique number for this specific balance record.
    id: { type: Number, required: true, unique: true },

    // The ID of the employee this balance belongs to.
    employee_id: { type: Number, required: true },

    // The ID of the leave type (Sick, Annual, etc.).
    leave_type_id: { type: Number, required: true },

    // Total number of days the employee still has available to use.
    remaining_days: { type: Number, required: true }
});

// 3. Export the Model: This makes the "LeaveBalance" list ready to use.
module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
