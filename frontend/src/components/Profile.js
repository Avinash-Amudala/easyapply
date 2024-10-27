// src/components/Profile.js
import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../api';

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
                console.error("Error fetching profile:", error);
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
            alert("Profile updated successfully");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile");
        }
    };

    if (loading) return <p>Loading profile...</p>;

    return (
        <div>
            <h2>Profile</h2>
            <form onSubmit={handleSubmit}>
                <label>Name:</label>
                <input type="text" name="name" value={profile.name} onChange={handleChange} />

                <label>Email:</label>
                <input type="email" name="email" value={profile.email} onChange={handleChange} readOnly />

                <label>Subscription Plan:</label>
                <input type="text" value={profile.subscriptionPlan} readOnly />

                <button type="submit">Update Profile</button>
            </form>
        </div>
    );
}

export default Profile;
