import React, { useState, useEffect } from 'react';
import { getJobs, logout } from '../api'; // Add logout
import JobCard from './JobCard';
import './Dashboard.css';

function Dashboard() {
    const [jobs, setJobs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
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

    const handleLogout = () => {
        logout();
        window.location.href = '/login'; // Redirect to login page
    };

    const filteredJobs = jobs.filter(job =>
        job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="dashboard-container">
            <div className="header">
                <h2>Your Job Applications</h2>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
            <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-bar"
            />
            {filteredJobs.length === 0 ? (
                <p>No job applications found.</p>
            ) : (
                <div className="job-cards">
                    {filteredJobs.map(job => (
                        <JobCard key={job._id} job={job} setJobs={setJobs} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dashboard;
