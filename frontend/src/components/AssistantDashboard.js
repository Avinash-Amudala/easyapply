import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssignedJobs, updateJobStatus, logout } from '../api';
import './AssistantDashboard.css';

function AssistantDashboard() {
    const [jobs, setJobs] = useState({ pending: [], applied: [], rejected: [] });
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const navigate = useNavigate();

    // Fetch and categorize jobs
    const fetchJobs = async () => {
        try {
            const response = await getAssignedJobs();
            const allJobs = Array.isArray(response) ? response : [];

            setJobs({
                pending: allJobs.filter(j => j.status === 'pending'),
                applied: allJobs.filter(j => j.status === 'applied'),
                rejected: allJobs.filter(j => j.status === 'rejected')
            });
        } catch (error) {
            alert('Failed to load jobs');
        }
    };

    useEffect(() => {
        if (localStorage.getItem('role') !== 'assistant') navigate('/');
        fetchJobs();
    }, []);

    // Handle status updates
    const handleStatusChange = async (jobId, status) => {
        try {
            const formData = new FormData();
            formData.append('status', status);

            if (status === 'applied' && !selectedFile) {
                alert('Please upload a PDF proof');
                return;
            }

            if (selectedFile) {
                formData.append('document', selectedFile);
            }

            const response = await updateJobStatus(jobId, formData);
            console.log('Update response:', response);

            await fetchJobs();
            setSelectedJob(null);
            setSelectedFile(null);

            if (status === 'applied') {
                setActiveTab('applied');
            }

            alert('Status updated successfully!');
        } catch (error) {
            console.error('Full error:', error);
            alert(`Update failed: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleLogout = async () => {
        try {
            localStorage.clear();
            sessionStorage.clear();

            document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";

            window.location.href = '/login';
        } catch (error) {
            console.error("Logout error:", error);
            window.location.href = '/login';
        }
    };

    return (
        <div className="assistant-dashboard">
            <div className="header">
                <h1>Assistant Dashboard</h1>
                <button onClick={handleLogout}>Logout</button>
            </div>

            <div className="tabs">
                {['pending', 'applied', 'rejected'].map(tab => (
                    <button
                        key={tab}
                        className={activeTab === tab ? 'active' : ''}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="job-list">
                {jobs[activeTab].map(job => (
                    <div key={job._id} className="job-card">
                        <h3>{job.title}</h3>
                        <p>Company: {job.company}</p>
                        <p>User: {job.userId?.name}</p>

                        {activeTab === 'pending' && (
                            <div className="actions">
                                <button
                                    onClick={() => {
                                        setSelectedJob(job);
                                        setSelectedFile(null);
                                    }}
                                >
                                    Mark Applied
                                </button>
                                <button
                                    onClick={() => handleStatusChange(job._id, 'rejected')}
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* PDF Upload Modal */}
            {selectedJob && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Upload Proof for {selectedJob.title}</h3>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setSelectedFile(e.target.files[0])}
                        />
                        <div className="modal-actions">
                            <button
                                onClick={() => handleStatusChange(selectedJob._id, 'applied')}
                                disabled={!selectedFile}
                            >
                                Submit
                            </button>
                            <button onClick={() => setSelectedJob(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AssistantDashboard;