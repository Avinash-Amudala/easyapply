import React from 'react';
import './JobCard.css';

function JobCard({ job }) {
    return (
        <div className="job-card">
            <h3>{job.jobTitle}</h3>
            <p>Company: {job.company}</p>
            <p>Status: {job.status}</p>
            <p>Applied Date: {new Date(job.appliedDate).toLocaleDateString()}</p>
            {job.notes && <p>Notes: {job.notes}</p>}
        </div>
    );
}

export default JobCard;
