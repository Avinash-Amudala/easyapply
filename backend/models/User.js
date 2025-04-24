const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Name is required'], trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
                message: props => `${props.value} is not a valid email!`
            }
        },
        password: {
            type: String,
            required: true,
            validate: {
                validator: function (v) {
                    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(v);
                },
                message: 'Password does not meet complexity requirements'
            }
        },
        role: { type: String, enum: ['user', 'assistant', 'admin'], default: 'user', required: true },
        assignedAssistant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        managedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        subscriptionStatus: { type: Boolean, default: false },
        subscriptionPlan: { type: String, enum: ['basic', 'pro', 'premium'], default: 'basic' },
        subscriptionStartDate: Date,
        subscriptionEndDate: Date,
        credits: { type: Number, default: 1000 },
        experience: { type: Number, required: false, default: 0 },
        skills: { type: [String], required: true },
        jobPreferences: {
            desiredSalary: Number,
            desiredJobRole: String, // Added desiredJobRole
            desiredSalaryRange: String,
            firstName: String,
            lastName: String,
            dateOfBirth: Date,
            phoneNumber: String,
            address: {
                line1: String,
                line2: String,
                city: String,
                state: String,
                country: String,
                zipcode: String
            },
            education: {
                university: String,
                fieldOfStudy: String,
                degree: String,
                gpa: Number,
                from: Date,
                to: Date
            },
            visaStatus: {
                eligibleToWork: Boolean,
                needsSponsorship: Boolean,
                sponsorshipType: String,
                visaExplanation: String
            },
            additionalInfo: {
                nationality: String,
                visaStartDate: Date,
                visaExpirationDate: Date,
                noticePeriod: String,
                currentSalary: Number,
                preferredShift: String,
                preferredDays: String,
                authorizedToWork: Boolean,
                preferredLocations: [String]
            }
        },
        uploadedDocuments: [{
            filename: { type: String, required: true },
            path: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now }
        }]
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        } catch (error) {
            return next(error);
        }
    }
    next();
});

userSchema.methods.comparePassword = async function (inputPassword) {
    if (!inputPassword) return false;
    return await bcrypt.compare(inputPassword, this.password);
};

userSchema.methods.isSubscriptionActive = function () {
    return this.subscriptionEndDate ? new Date() <= this.subscriptionEndDate : false;
};

userSchema.virtual('isActive').get(function () {
    return this.isSubscriptionActive();
});

userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema);