// src/components/JobCard.js
import React from 'react';
import './JobCard.css';

function JobCard({ job, setJobs }) {
    const handleEdit = () => {
        // Open a modal for editing
        console.log('Edit job:', job);
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete the job "${job.jobTitle}"?`)) {
            try {
                await deleteJob(job._id);
                setJobs(prev => prev.filter(j => j._id !== job._id));
            } catch (error) {
                console.error('Error deleting job:', error);
            }
        }
    };

    return (
        <div className="job-card">
            <h3>{job.jobTitle}</h3>
            <p><strong>Company:</strong> {job.company}</p>
            <p><strong>Status:</strong> {job.status}</p>
            <p><strong>Applied Date:</strong> {new Date(job.appliedDate).toLocaleDateString()}</p>
            {job.notes && <p><strong>Notes:</strong> {job.notes}</p>}
            <div className="job-card-actions">
                <button onClick={handleEdit} className="btn edit-btn">Edit</button>
                <button onClick={handleDelete} className="btn delete-btn">Delete</button>
            </div>
        </div>
    );
}

export default JobCard;
