// src/components/Jobs.js
import React, { useState, useEffect } from 'react';
import { getJobs } from '../api';
import './Jobs.css';

function Jobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await getJobs();
                setJobs(data);
            } catch (error) {
                console.error('Error fetching jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    const filteredJobs = jobs.filter(job =>
        job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="jobs-container">
            <h1>Job Listings</h1>
            <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-bar"
            />
            {loading ? (
                <p className="loading-text">Loading jobs...</p>
            ) : (
                <div className="jobs-list">
                    {filteredJobs.length === 0 ? (
                        <p className="no-jobs-text">No jobs found.</p>
                    ) : (
                        filteredJobs.map(job => (
                            <div className="job-card" key={job._id}>
                                <h3>{job.jobTitle}</h3>
                                <p>Company: {job.company}</p>
                                <p>Location: {job.location || 'N/A'}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default Jobs;
