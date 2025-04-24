import React from 'react';
import './JobCard.css';

function JobCard({ job, onDelete, type }) {
    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this job?")) {
            try {
                await onDelete(job._id);
            } catch (error) {
                alert('Failed to delete the job. Please try again.');
            }
        }
    };

    return (
        <div className={`job-card ${job.status}`}>
            <h3>
                <a href={job.link} target="_blank" rel="noopener noreferrer">
                    {job.title}
                </a>
            </h3>
            <p><strong>Company:</strong> {job.company}</p>
            <p><strong>Status:</strong> {job.status}</p>
            <p><strong>{type === 'delegated' ? 'Delegated Date' : 'Applied Date'}:</strong>
                {new Date(job.dateDelegated || job.createdAt).toLocaleDateString()}
            </p>
            <div className="job-card-actions">
                <button className="btn edit-btn">Edit</button>
                <button onClick={handleDelete} className="btn delete-btn">Delete</button>
            </div>
            {type === 'delegated' && job.assistant && (
                <p><strong>Assistant:</strong> {job.assistant.name}</p>
            )}
            {type === 'applied' && job.completedAt && (
                <p><strong>Completed:</strong> {new Date(job.completedAt).toLocaleDateString()}</p>
            )}
        </div>
    );
}

export default JobCard;
