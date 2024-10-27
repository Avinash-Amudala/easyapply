const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' }, // can be 'user' or 'admin'
    subscriptionPlan: { type: String, enum: ['basic', 'pro', 'premium'], default: 'basic' },
    subscriptionStatus: { type: Boolean, default: false } // true if subscribed
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) return next();

        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function (inputPassword) {
    return await bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
