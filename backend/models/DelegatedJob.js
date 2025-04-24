const mongoose = require('mongoose');

const delegatedJobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    link: { type: String, required: true },
    description: String,
    assistant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    applicationDate: Date,
    applicationStatus: String,
    status: {
        type: String,
        enum: ['pending', 'applied', 'rejected'],
        default: 'pending'
    },
    dateDelegated: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    proofDocument: {
        filename: String,
        path: String,
        uploadedAt: Date
    },
    history: [{
        status: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: Date,
        notes: String
    }]
}, { timestamps: true });

delegatedJobSchema.index({ userId: 1, status: 1 });
delegatedJobSchema.index({ assistant: 1, status: 1 });

module.exports = mongoose.model('DelegatedJob', delegatedJobSchema);
