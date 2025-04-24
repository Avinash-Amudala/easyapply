const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        index: true
    },
    company: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    skills: [{
        type: String,
        required: true
    }],
    location: {
        type: String,
        required: true
    },
    is_remote: {
        type: Boolean,
        default: false
    },
    experience_level: {
        type: String,
        enum: ['entry', 'mid', 'senior'],
        required: true
    },
    salary: {
        type: Number,
        index: true
    },
    posted_date: {
        type: Date,
        default: Date.now
    },
    link: {
        type: String,
        required: true,
        unique: true
    },
    source: {
        type: String,
        enum: ['linkedin', 'indeed', 'company_site'],
        required: true
    },
    recruiter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sponsorship_available: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true }
});

jobSchema.index({ title: 'text', description: 'text' });
jobSchema.index({ title: 'text', description: 'text', skills: 'text', location: 'text' });

jobSchema.pre('save', function(next) {
    if (!this.skills || this.skills.length === 0) {
        this.skills = ['General'];
    }
    next();
});

module.exports = mongoose.model('Job', jobSchema);