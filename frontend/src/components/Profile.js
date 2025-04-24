import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../api';
import './Profile.css';

function Profile() {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        experience: 0,
        skills: [],
        uploadedDocuments: [],
        jobPreferences: {
            desiredSalary: 0,
            desiredJobRole: '',
            visaStatus: { needsSponsorship: false },
            preferredLocations: [],
            remotePreferred: false
        },
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProfile = async () => {
        try {
            const data = await getUserProfile();
            const transformedData = {
                name: data.name || '',
                email: data.email || '',
                experience: data.experience || 0,
                skills: data.skills || [],
                uploadedDocuments: data.uploadedDocuments || [],
                jobPreferences: {
                    desiredSalary: data.jobPreferences?.desiredSalary || 0,
                    desiredJobRole: data.jobPreferences?.desiredJobRole || '',
                    visaStatus: { needsSponsorship: data.jobPreferences?.visaStatus?.needsSponsorship || false },
                    preferredLocations: data.jobPreferences?.preferredLocations || [],
                    remotePreferred: data.jobPreferences?.remotePreferred || false
                },
            };
            setProfile(transformedData);
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const keys = name.split('.');

        setProfile((prev) => {
            if (keys.length === 1) {
                return { ...prev, [name]: type === 'checkbox' ? checked : value };
            } else if (keys.length === 2) {
                return {
                    ...prev,
                    [keys[0]]: {
                        ...prev[keys[0]],
                        [keys[1]]: type === 'checkbox' ? checked : value,
                    },
                };
            } else if (keys.length === 3) {
                return {
                    ...prev,
                    [keys[0]]: {
                        ...prev[keys[0]],
                        [keys[1]]: {
                            ...prev[keys[0]][keys[1]],
                            [keys[2]]: type === 'checkbox' ? checked : value,
                        },
                    },
                };
            }
            return prev;
        });
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setProfile((prev) => ({ ...prev, uploadedDocuments: files }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', profile.name);
            formData.append('email', profile.email);
            formData.append('experience', profile.experience || 0);
            formData.append('skills', JSON.stringify(profile.skills));
            formData.append('jobPreferences', JSON.stringify(profile.jobPreferences));
            profile.uploadedDocuments.forEach((file) => formData.append('uploadedDocuments', file));

            await updateUserProfile(formData);
            await fetchProfile();
            alert('Profile updated successfully');
        } catch (err) {
            console.error('Error updating profile:', err);
            alert('Failed to update profile: ' + err.message);
        }
    };

    if (loading) return <p>Loading profile...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="profile-container">
            <form onSubmit={handleSubmit} className="profile-form">
                <h1>Your Profile</h1>
                <div className="profile-field">
                    <label htmlFor="name">Name:</label>
                    <input type="text" id="name" name="name" value={profile.name} onChange={handleChange} required />
                </div>
                <div className="profile-field">
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email" value={profile.email} onChange={handleChange} required />
                </div>
                <div className="profile-field">
                    <label htmlFor="experience">Years of Experience:</label>
                    <input type="number" id="experience" name="experience" value={profile.experience} onChange={handleChange} min="0" />
                </div>
                <div className="profile-field">
                    <label htmlFor="skills">Skills (comma-separated):</label>
                    <input
                        type="text"
                        id="skills"
                        name="skills"
                        value={profile.skills.join(', ')}
                        onChange={(e) => setProfile(prev => ({ ...prev, skills: e.target.value.split(',').map(s => s.trim()) }))}
                        required
                    />
                </div>
                <div className="profile-field">
                    <label htmlFor="desiredSalary">Desired Salary:</label>
                    <input type="number" id="desiredSalary" name="jobPreferences.desiredSalary" value={profile.jobPreferences.desiredSalary} onChange={handleChange} min="0" />
                </div>
                <div className="profile-field">
                    <label htmlFor="desiredJobRole">Desired Job Role:</label>
                    <input type="text" id="desiredJobRole" name="jobPreferences.desiredJobRole" value={profile.jobPreferences.desiredJobRole} onChange={handleChange} />
                </div>
                <div className="profile-field">
                    <label htmlFor="needsSponsorship">Needs Sponsorship:</label>
                    <input
                        type="checkbox"
                        id="needsSponsorship"
                        name="jobPreferences.visaStatus.needsSponsorship"
                        checked={profile.jobPreferences.visaStatus.needsSponsorship}
                        onChange={handleChange}
                    />
                </div>
                <div className="profile-field">
                    <label htmlFor="preferredLocations">Preferred Locations (comma-separated):</label>
                    <input
                        type="text"
                        id="preferredLocations"
                        name="jobPreferences.preferredLocations"
                        value={profile.jobPreferences.preferredLocations.join(', ')}
                        onChange={(e) => setProfile(prev => ({
                            ...prev,
                            jobPreferences: {
                                ...prev.jobPreferences,
                                preferredLocations: e.target.value.split(',').map(loc => loc.trim())
                            }
                        }))}
                    />
                </div>
                <div className="profile-field">
                    <label htmlFor="remotePreferred">Prefers Remote Work:</label>
                    <input
                        type="checkbox"
                        id="remotePreferred"
                        name="jobPreferences.remotePreferred"
                        checked={profile.jobPreferences.remotePreferred}
                        onChange={handleChange}
                    />
                </div>
                <div className="profile-field">
                    <label>Upload Documents:</label>
                    <input type="file" multiple onChange={handleFileUpload} />
                </div>
                <button type="submit" className="update-btn">Update Profile</button>
            </form>
        </div>
    );
}

export default Profile;