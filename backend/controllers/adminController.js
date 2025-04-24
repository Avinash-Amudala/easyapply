// backend/controllers/adminController.js
const User = require('../models/User');
const JobApplication = require('../models/JobApplication');
const DelegatedJob = require('../models/DelegatedJob');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

exports.createAssistant = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // ✅ Check for existing user with the same username (name)
        const existingUser = await User.findOne({ name });
        if (existingUser) {
            return res.status(400).json({ message: "Username is already taken. Please choose a different one." });
        }

        // ✅ Check for existing user with the same email
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ message: "Email is already registered." });
        }

        // ✅ Validate password strength
        const passwordError = validatePasswordStrength(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        // ✅ Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        const assistant = new User({
            name,
            email,
            password: hashedPassword,
            role: 'assistant'
        });

        await assistant.save();

        res.status(201).json({
            message: "🎉 Assistant created successfully!",
            assistant: { name: assistant.name, email: assistant.email }
        });

    } catch (error) {
        console.error("❌ Error creating assistant:", error);
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

function validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) return "Password must be at least 8 characters long.";
    if (!hasUpperCase) return "Password must contain at least one uppercase letter.";
    if (!hasLowerCase) return "Password must contain at least one lowercase letter.";
    if (!hasNumbers) return "Password must contain at least one number.";
    if (!hasSpecial) return "Password must contain at least one special character.";

    return null;
}

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' })
            .populate({
                path: 'assignedAssistant',
                select: 'name email'
            });

        console.log("📌 Populated Users:", users);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

exports.getAllAssistants = async (req, res) => {
    try {
        const assistants = await User.find({ role: 'assistant' });
        res.json(assistants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assistants' });
    }
};

exports.assignAssistant = async (req, res) => {
    try {
        const { userId, assistantId } = req.body;

        // Transfer all existing jobs
        await DelegatedJob.updateMany(
            { userId: userId },
            { assistant: assistantId }
        );

        await JobApplication.updateMany(
            { userId: userId, status: 'delegated' },
            { $set: { 'delegatedTo': assistantId } }
        );

        const user = await User.findById(userId);
        user.assignedAssistant = assistantId;
        await user.save();

        const assistant = await User.findById(assistantId);
        assistant.managedUsers.addToSet(userId);
        await assistant.save();

        res.json({ user, assistant });
    } catch (error) {
        console.error("Assignment error:", error);
        res.status(500).json({ message: "Error assigning assistant" });
    }
};

exports.getAssistantProgress = async (req, res) => {
    try {
        const assistantId = req.params.assistantId;
        const jobs = await DelegatedJob.find({ assistant: assistantId })
            .populate('user', 'name email');

        const stats = await DelegatedJob.aggregate([
            {
                $match: {
                    assistant: mongoose.Types.ObjectId(assistantId)
                }},
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    averageTime: { $avg: { $subtract: ["$updatedAt", "$createdAt"] } }
                }
            }
        ]);

        res.json({ jobs, stats });
    } catch (error) {
        console.error('Progress error:', error);
        res.status(500).json({ message: 'Error fetching progress' });
    }
};