// backend/controllers/jobController.js
const JobApplication = require('../models/JobApplication');

exports.getJobs = async (req, res) => {
    try {
        const jobs = await JobApplication.find({ userId: req.user._id });
        res.status(200).json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Server error' });
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
