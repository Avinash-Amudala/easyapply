import React, { useState, useEffect } from 'react';
import { getJobs, delegateJob, deleteJob } from '../api';
import JobCard from './JobCard';
import JobForm from './JobForm';
import './Jobs.css';

function Jobs() {
    const [activeTab, setActiveTab] = useState('saved');
    const [showForm, setShowForm] = useState(false);
    const [jobs, setJobs] = useState({
        saved: [],
        delegated: [],
        applied: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchJobs = async () => {
        try {
            const jobsData = await getJobs();
            console.log('Raw jobs data:', jobsData);

            setJobs({
                saved: jobsData.saved || [],
                delegated: jobsData.delegated || [],
                applied: jobsData.applied || []
            });
            setError(null);
        } catch (error) {
            setError('Failed to load jobs: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleDelete = async (jobId) => {
        try {
            await deleteJob(jobId);
            setJobs(prev => ({
                ...prev,
                [activeTab]: prev[activeTab].filter(job => job._id !== jobId)
            }));
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete job');
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            const response = await delegateJob(formData);
            setJobs(prev => ({
                ...prev,
                delegated: [...prev.delegated, response.job] // Match response structure
            }));
            setShowForm(false);
        } catch (error) {
            console.error('Delegation error:', error);
            alert(error.message);
        }
    };

    if (loading) return <div className="loading">Loading jobs...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="jobs-container">
            <div className="tabs-header">
                <div className="tabs">
                    {['saved', 'delegated', 'applied'].map(tab => (
                        <button
                            key={tab}
                            className={`tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
                <button
                    className="add-job-button"
                    onClick={() => setShowForm(true)}
                    disabled={activeTab === 'applied'}
                >
                    Add Job
                </button>
            </div>

            {showForm && (
                <JobForm
                    mode={activeTab}
                    onClose={() => setShowForm(false)}
                    onSubmit={handleFormSubmit}
                />
            )}

            <div className="jobs-list">
                {jobs[activeTab].map(job => (
                    <JobCard
                        key={job._id}
                        job={job}
                        type={activeTab}
                        onDelete={() => handleDelete(job._id)}
                    />
                ))}
            </div>
        </div>
    );
}

export default Jobs;