import React, { useState, useEffect, useCallback } from 'react';
import { trackActivity, getUserProfile } from '../api';
import API from '../api';
import './Recommendations.css';
import moment from 'moment';

const Recommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [filters, setFilters] = useState({
        location: '',
        experienceLevel: '',
        remoteOnly: false,
        minSalary: '',
        page: 1,
        per_page: 20,
        sort_by: 'posted_date',  // Default to posted_date
        date_posted: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [processLog, setProcessLog] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [totalJobs, setTotalJobs] = useState(0);

    const addProcessLog = useCallback((message) => {
        setProcessLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
    }, []);

    const fetchRecommendations = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            addProcessLog('Fetching recommendations...');

            const profile = await getUserProfile();
            if (!profile || !profile.skills?.length) {
                setError('Please add skills to your profile to get recommendations.');
                return;
            }

            const requestData = {
                user_profile: {
                    skills: profile.skills || [],
                    experience_level: profile.experience < 2 ? 'entry' : profile.experience < 5 ? 'mid' : 'senior',
                    needs_sponsorship: profile.jobPreferences?.visaStatus?.needsSponsorship || false,
                    preferred_locations: profile.jobPreferences?.preferredLocations || [],
                    min_salary: profile.jobPreferences?.desiredSalary || 0,
                    remote_preference: profile.jobPreferences?.remotePreferred || false,
                    desired_job_role: profile.jobPreferences?.desiredJobRole || profile.skills.join(' ')
                },
                filters: {
                    location: filters.location || null,
                    experienceLevel: filters.experienceLevel || null,
                    remoteOnly: filters.remoteOnly,
                    minSalary: parseFloat(filters.minSalary) || 0,
                    page: filters.page,
                    per_page: filters.per_page,
                    sort_by: filters.sort_by,
                    date_posted: filters.date_posted || null
                }
            };

            const response = await API.post('/jobs/recommendations', requestData, { timeout: 60000 });
            const { recommendations: recs, total } = response.data;

            setRecommendations(prev => filters.page === 1 ? recs : [...prev, ...recs]);
            setTotalJobs(total);
            setHasMore(filters.page * filters.per_page < total);
            addProcessLog(`Received ${recs.length} recommendations, total available: ${total}`);
            await trackActivity({ type: 'recommendations_shown', count: recs.length });
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                setError('Request timed out after 60 seconds. Partial results may be available.');
            } else {
                setError(error.response?.data?.detail || 'Failed to load recommendations.');
            }
            addProcessLog(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [filters, addProcessLog]);

    useEffect(() => {
        fetchRecommendations();
    }, [fetchRecommendations]);

    const handleJobClick = async (job) => {
        await trackActivity({ type: 'job_view', jobId: job.link });
        window.open(job.link, '_blank', 'noopener,noreferrer');
    };

    const handleDelegateJob = async (job) => {
        try {
            const jobData = {
                title: job.title,
                company: job.company || 'Unknown Company',
                link: job.link,
                description: job.description || 'No description available'
            };
            const response = await API.post('/jobs/delegate', jobData);
            if (response.status === 201) {
                alert('✅ Job delegated successfully!');
            } else {
                throw new Error('Delegation failed');
            }
        } catch (error) {
            console.error('Delegation error:', error);
            alert(`❌ Error: ${error.response?.data?.message || error.message}`);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            page: 1
        }));
    };

    const handleApplyFilters = () => {
        setRecommendations([]);  // Clear previous recommendations
        setFilters(prev => ({ ...prev, page: 1 }));
        fetchRecommendations();
    };

    const handleRefresh = () => {
        setRecommendations([]);  // Clear previous recommendations
        setFilters(prev => ({ ...prev, page: 1 }));
        fetchRecommendations();
    };

    const handleLoadMore = () => {
        setFilters(prev => ({ ...prev, page: prev.page + 1 }));
        fetchRecommendations();
    };

    return (
        <div className="recommendations-container">
            <h1>Job Recommendations</h1>
            <div className="search-filters">
                <input
                    type="text"
                    placeholder="Preferred Location in USA"
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                />
                <select
                    name="experienceLevel"
                    value={filters.experienceLevel}
                    onChange={handleFilterChange}
                >
                    <option value="">All Experience Levels</option>
                    <option value="entry">Entry</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                </select>
                <input
                    type="number"
                    placeholder="Minimum Salary"
                    name="minSalary"
                    value={filters.minSalary}
                    onChange={handleFilterChange}
                />
                <label>
                    <input
                        type="checkbox"
                        name="remoteOnly"
                        checked={filters.remoteOnly}
                        onChange={handleFilterChange}
                    /> Remote Only
                </label>
                <select
                    name="sort_by"
                    value={filters.sort_by}
                    onChange={handleFilterChange}
                >
                    <option value="posted_date">Sort by Posted Date</option>
                    <option value="matchScore">Sort by Match Score</option>
                </select>
                <select
                    name="date_posted"
                    value={filters.date_posted}
                    onChange={handleFilterChange}
                >
                    <option value="">All Time</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                </select>
                <button onClick={handleApplyFilters} className="apply-filters-btn">
                    Apply Filters
                </button>
                <button onClick={handleRefresh} className="refresh-btn">
                    Refresh
                </button>
            </div>

            {loading && (
                <div className="loading-indicator">
                    <p>Loading recommendations...</p>
                </div>
            )}
            {error && <div className="error">{error}</div>}

            <div className="process-log">
                {processLog.map((log, index) => (
                    <p key={index}>{log}</p>
                ))}
            </div>

            <div className="results">
                {recommendations.length > 0 ? (
                    recommendations.map((job, index) => (
                        <div
                            key={job.link || index}
                            className={`job-card ${job.is_hot ? 'hot-job' : ''}`}
                            onClick={() => handleJobClick(job)}
                        >
                            <div className="job-header">
                                <h3>{job.title || "No Title Available"}</h3>
                                {job.is_hot && <span className="hot-badge">🔥 Hot</span>}
                                {job.is_remote && <span className="remote-badge">🌍 Remote</span>}
                                <span className={`source-badge ${job.source === 'linkedin' ? 'linkedin' : 'adzuna'}`}>
                                    {job.source}
                                </span>
                            </div>
                            <div className="details">
                                <div className="detail-item">
                                    <span className="location">
                                        📍 {job.location || "Not Specified"}
                                    </span>
                                    <span className="salary">
                                        💰 {job.salary ? `$${job.salary.toLocaleString()}` : "Not Listed"}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="posted-date">
                                        📅 Posted: {job.posted_date ? moment(job.posted_date).fromNow() : "Unknown"}
                                    </span>
                                    <span className="experience">
                                        📈 {job.experience_level || "Not Specified"}
                                    </span>
                                </div>
                                {job.skills?.length > 0 && (
                                    <div className="skills-container">
                                        🛠️ Skills: {job.skills.map((skill, i) => (
                                        <span key={i} className="skill-tag">{skill}</span>
                                    ))}
                                    </div>
                                )}
                                {job.skill_gaps?.length > 0 && (
                                    <div className="skill-gaps-container">
                                        📚 Learn: {job.skill_gaps.map((skill, i) => (
                                        <span key={i} className="skill-gap-tag">{skill}</span>
                                    ))}
                                    </div>
                                )}
                                <div className="match-score-container">
                                    ⭐ Match Score: {job.matchScore?.toFixed(1) || 'N/A'}%
                                </div>
                            </div>
                            <div className="actions">
                                {job.link && (
                                    <a
                                        href={job.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="apply-btn"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        Apply Now
                                    </a>
                                )}
                                <button
                                    className="delegate-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelegateJob(job);
                                    }}
                                >
                                    Delegate to Assistant
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    !loading && (
                        <div className="no-results">
                            <p>No jobs found matching your criteria</p>
                            <button onClick={handleRefresh}>Refresh</button>
                        </div>
                    )
                )}
                {hasMore && !loading && recommendations.length > 0 && (
                    <button onClick={handleLoadMore} className="load-more-btn">
                        Load More ({recommendations.length} of {totalJobs})
                    </button>
                )}
            </div>
        </div>
    );
};

export default Recommendations;