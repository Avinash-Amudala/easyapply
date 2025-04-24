const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    jobTitle: {
        type: String,
        required: true,
    },
    company: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['applied', 'interviewing', 'offer', 'rejected'],
        default: 'applied',
    },
    appliedDate: {
        type: Date,
        default: Date.now,
    },
    notes: String,
    link: String,
    description: String
});

jobApplicationSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
