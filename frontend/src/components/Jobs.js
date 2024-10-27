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
        job.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h2>Job Listings</h2>
            <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
            />
            <div className="jobs-list">
                {filteredJobs.length === 0 ? (
                    <p>No jobs found.</p>
                ) : (
                    filteredJobs.map(job => (
                        <div className="job-card" key={job._id}>
                            <h3>{job.title}</h3>
                            <p>{job.company}</p>
                            <p>{job.location}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Jobs;
