// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';
import { getJobs } from '../api';
import JobCard from './JobCard';

function Dashboard() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await getJobs();
                setJobs(data);
            } catch (error) {
                console.error('Error fetching jobs:', error);
                setError('Failed to load job applications');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Your Job Applications</h2>
            {jobs.length === 0 ? (
                <p>No job applications found.</p>
            ) : (
                jobs.map(job => <JobCard key={job._id} job={job} />)
            )}
        </div>
    );
}

export default Dashboard;
