// 1. Import Mongoose: This tool helps us create rules for our database.
const mongoose = require('mongoose');

// 2. The Blueprint (Schema): This defines what a "Type of Leave" looks like.
const leaveTypeSchema = new mongoose.Schema({
    // A unique number for each leave type (1 for Sick Leave, 2 for Annual, etc).
    id: { type: Number, required: true, unique: true },

    // The name of the leave (e.g., "Sick Leave" or "Casual Leave").
    name: { type: String, required: true },

    // The maximum number of days a person can take of this type per year.
    max_days_per_year: { type: Number, required: true }
});

// 3. Export the Model: This tells the database to use this blueprint for LeaveTypes.
module.exports = mongoose.model('LeaveType', leaveTypeSchema);
