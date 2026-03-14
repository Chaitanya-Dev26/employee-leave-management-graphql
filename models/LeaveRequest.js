// 1. Import Mongoose: This helps us save and find leave requests in the database.
const mongoose = require('mongoose');

// 2. The Blueprint (Schema): This is the form someone fills out when they want a vacation.
const leaveRequestSchema = new mongoose.Schema({
    // A unique number for this specific request.
    id: { type: Number, required: true, unique: true },

    // Who is asking for leave? (Their Employee ID number).
    employee_id: { type: Number, required: true },

    // What kind of leave is it? (Sick, Annual, etc.).
    leave_type_id: { type: Number, required: true },

    // When does the leave start?
    start_date: { type: String, required: true },

    // When does the leave end?
    end_date: { type: String, required: true },

    // Why are they taking leave? (Optional).
    reason: String,

    // What is the progress? Starts at 'pending' until a manager decides.
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending'
    },

    // The exact date and time the person clicked "Submit".
    applied_at: { type: Date, default: Date.now }
});

// 3. Export the Model: This makes the "LeaveRequest" system live.
module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
