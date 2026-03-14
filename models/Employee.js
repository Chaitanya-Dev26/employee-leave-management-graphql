// 1. Import Mongoose: This is the tool that helps us talk to MongoDB easily.
const mongoose = require('mongoose');

// 2. The Blueprint (Schema): Think of this as a "Form" that every Employee must fill out.
const employeeSchema = new mongoose.Schema({
    // Every employee gets a unique number (ID) so we don't mix them up.
    id: { type: Number, required: true, unique: true },

    // Their full name.
    name: { type: String, required: true },

    // Their email address (every email must be different).
    email: { type: String, required: true, unique: true },

    // Which department they work in (like HR or Engineering).
    department: String,

    // Their job title (like Software Engineer).
    designation: String,

    // The date they started working here.
    joining_date: String,

    // Their role: They can ONLY be an 'employee' or a 'manager'.
    role: { type: String, enum: ['employee', 'manager'], required: true }
});

// 3. Export the Model: This creates the actual "Employee" collection in the database.
module.exports = mongoose.model('Employee', employeeSchema);
