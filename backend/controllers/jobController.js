const JobApplication = require('../models/JobApplication');
const User = require('../models/User');
const DelegatedJob = require('../models/DelegatedJob');
const axios = require('axios');
const Job = require('../models/Job');

exports.getJobs = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('assignedAssistant', 'name email');

        const [saved, delegated, appliedDelegated] = await Promise.all([
            JobApplication.find({ userId: req.user._id, status: 'saved' }),
            DelegatedJob.find({ userId: req.user._id, status: 'pending' }),
            DelegatedJob.find({ userId: req.user._id, status: 'applied' })
        ]);

        const applied = await JobApplication.find({ userId: req.user._id, status: 'applied' });

        const combinedApplied = [
            ...applied,
            ...appliedDelegated.map(job => ({
                _id: job._id,
                title: job.title,
                company: job.company,
                status: 'applied',
                appliedDate: job.appliedAt,
                link: job.link,
                description: job.description,
                isDelegated: true
            }))
        ];

        res.json({
            saved,
            delegated,
            applied: combinedApplied,
            assignedAssistant: user.assignedAssistant || null
        });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Error retrieving jobs' });
    }
};

exports.addJob = async (req, res) => {
    try {
        const job = new JobApplication({ ...req.body, userId: req.user._id });
        await job.save();
        res.status(201).json(job);
    } catch (error) {
        console.error('Error adding job:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const job = await JobApplication.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true }
        );
        res.status(200).json(job);
    } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        await JobApplication.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAssignedJobs = async (req, res) => {
    try {
        const jobs = await DelegatedJob.find({ assistant: req.user._id })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.json(jobs);
    } catch (error) {
        console.error("Error fetching assigned jobs:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.delegateJob = async (req, res) => {
    try {
        if (!req.user?.assignedAssistant) {
            return res.status(403).json({ message: 'No assistant assigned' });
        }

        if (!req.user.subscriptionStatus) {
            await User.findByIdAndUpdate(req.user._id,
                { $inc: { credits: -1 } },
                { new: true }
            );
        }

        const delegatedJob = new DelegatedJob({
            ...req.body,
            userId: req.user._id,
            assistant: req.user.assignedAssistant
        });

        await delegatedJob.save();

        const populated = await DelegatedJob.findById(delegatedJob._id)
            .populate('userId', 'name email')
            .populate('assistant', 'name email');

        res.status(201).json(populated);
    } catch (error) {
        console.error('Delegation error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const file = req.file;

        const updateData = {
            status,
            ...(status === 'applied' && { appliedAt: new Date() })
        };

        if (file && status === 'applied') {
            updateData.proofDocument = {
                filename: file.originalname,
                path: file.path,
                uploadedAt: new Date()
            };
        }

        const job = await DelegatedJob.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).populate('userId', 'name email');

        if (!job) return res.status(404).json({ message: "Job not found" });

        if (status === 'applied') {
            await JobApplication.findOneAndUpdate(
                { userId: job.userId, link: job.link },
                {
                    status: 'applied',
                    title: job.title,
                    company: job.company,
                    description: job.description,
                    link: job.link,
                    appliedDate: new Date()
                },
                { upsert: true, new: true }
            );
        }

        res.json({ message: "Job status updated successfully!", job });
    } catch (error) {
        console.error("Error updating job status:", error);
        res.status(500).json({ message: "Server error: " + error.message });
    }
};

exports.getJobRecommendations = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('skills experience jobPreferences')
            .lean();

        if (!user.skills || user.skills.length === 0) {
            return res.status(400).json({
                code: 'INCOMPLETE_PROFILE',
                message: 'Add at least 3 skills to get recommendations'
            });
        }

        const requestData = {
            user_profile: {
                skills: user.skills || [],
                experience_level: getExperienceLevel(user.experience),
                needs_sponsorship: user.jobPreferences?.visaStatus?.needsSponsorship || false,
                preferred_locations: user.jobPreferences?.preferredLocations || [],
                min_salary: user.jobPreferences?.minSalary || 0,
                remote_preference: user.jobPreferences?.remotePreferred || false,
                desired_job_role: user.jobPreferences?.desiredJobRole || ""
            },
            filters: req.body.filters || {}
        };

        const response = await axios.post(
            'http://localhost:5001/jobs/recommendations',
            requestData,
            { timeout: 60000 }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Recommendation error:', error.message);
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                code: 'TIMEOUT',
                message: 'Recommendation request timed out. Please try again later.'
            });
        }
        res.status(500).json({
            code: 'RECOMMENDATION_FAILED',
            message: error.response?.data?.detail || 'Failed to fetch recommendations'
        });
    }
};

function getExperienceLevel(years) {
    if (!years) return 'mid';
    return years < 2 ? 'entry' : years < 5 ? 'mid' : 'senior';
}