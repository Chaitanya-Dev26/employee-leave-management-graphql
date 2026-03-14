// 1. Import Mongoose: This tool lets us record the manager's decision.
const mongoose = require('mongoose');

// 2. The Blueprint (Schema): This records when a manager says "Yes" or "No" to a leave request.
const approvalSchema = new mongoose.Schema({
    // A unique number for this approval record.
    id: { type: Number, required: true, unique: true },

    // Which leave request are we talking about?
    leave_request_id: { type: Number, required: true },

    // Which manager made the decision? (Their Employee ID number).
    manager_id: { type: Number, required: true },

    // Did they approve it or reject it?
    status: { type: String, required: true },

    // Any notes the manager wrote (e.g., "Enjoy your trip!").
    remarks: String,

    // The exact time the manager clicked the button.
    approved_at: { type: Date, default: Date.now }
});

// 3. Export the Model: This creates the "Approval" collection in our database.
module.exports = mongoose.model('Approval', approvalSchema);
