// src/components/Profile.js
import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../api';
import './Profile.css';

function Profile() {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        subscriptionPlan: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getUserProfile();
                setProfile(data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateUserProfile(profile);
            alert('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    return (
        <div className="profile-container">
            {loading ? (
                <p className="loading-text">Loading profile...</p>
            ) : (
                <form onSubmit={handleSubmit} className="profile-form">
                    <h1>Your Profile</h1>
                    <div className="profile-field">
                        <label htmlFor="name">Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={profile.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="profile-field">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={profile.email}
                            onChange={handleChange}
                            readOnly
                        />
                    </div>
                    <div className="profile-field">
                        <label htmlFor="subscriptionPlan">Subscription Plan:</label>
                        <input
                            type="text"
                            id="subscriptionPlan"
                            value={profile.subscriptionPlan}
                            readOnly
                        />
                    </div>
                    <button type="submit" className="update-btn">
                        Update Profile
                    </button>
                </form>
            )}
        </div>
    );
}

export default Profile;
