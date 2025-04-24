import React, { useEffect, useState } from 'react';
import API, { getJobs } from '../api';
import JobCard from './JobCard';
import Sidebar from './Sidebar';
import './Dashboard.css';
import AnalyticsGraphs from '../components/AnalyticsGraphs';

function Dashboard() {
    const [jobs, setJobs] = useState({ saved: [], delegated: [], applied: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [assignedAssistant, setAssignedAssistant] = useState(null);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const jobList = await getJobs();

                setJobs({
                    saved: jobList.saved || [],
                    delegated: jobList.delegated || [],
                    applied: jobList.applied || [],
                });

                setAssignedAssistant(jobList.assignedAssistant || null);
            } catch (error) {
                console.error('❌ Error fetching jobs:', error.response?.data || error.message);
                setError('⚠️ Failed to load job applications. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    // ✅ Function to handle job status updates dynamically
    const handleJobStatusUpdate = (jobId, newStatus) => {
        setJobs(prevJobs => {
            const updatedDelegated = prevJobs.delegated.map(job =>
                job._id === jobId ? { ...job, status: newStatus } : job
            );

            const updatedApplied = newStatus === 'applied'
                ? [...prevJobs.applied, updatedDelegated.find(job => job._id === jobId)]
                : prevJobs.applied;

            return {
                ...prevJobs,
                delegated: updatedDelegated.filter(job => job.status !== 'applied'),
                applied: updatedApplied
            };
        });
    };

    const filteredJobs = [...jobs.saved, ...jobs.delegated, ...jobs.applied].filter(job =>
        (job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.company?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="dashboard-container">
            <Sidebar />
            <div className="dashboard-content">
                <div className="header">
                    <h2>Your Job Applications</h2>
                </div>

                {assignedAssistant && (
                    <div className="assistant-info">
                        <h3>Your Assistant: {assignedAssistant.name}</h3>
                        <p>Contact: {assignedAssistant.email}</p>
                    </div>
                )}

                <AnalyticsGraphs saved={jobs.saved} applied={jobs.applied} />

                <input
                    type="text"
                    placeholder="Search jobs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-bar"
                />
            </div>
        </div>
    );
}

export default Dashboard;
