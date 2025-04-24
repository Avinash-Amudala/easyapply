import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { checkSubscriptionAndCredits, logout, updateSubscription } from '../api';
import './Sidebar.css';

function Sidebar({ setIsLoggedIn }) {
    const [credits, setCredits] = useState(0);
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        const fetchSubscriptionData = async () => {
            try {
                const { isSubscribed, credits } = await checkSubscriptionAndCredits();
                setCredits(credits);
                setIsSubscribed(isSubscribed);
            } catch (error) {
                console.error('Error fetching subscription and credits:', error);
            }
        };

        fetchSubscriptionData();
    }, []);

    const handleUnsubscribe = async () => {
        try {
            await updateSubscription(null);
            setIsSubscribed(false);
            setCredits(0);
        } catch (error) {
            console.error('Unsubscribe error:', error);
        }
    };

    const handleLogout = () => {
        logout(() => {
            setIsLoggedIn(false); // Update the login state
        });
    };

    return (
        <div className="sidebar">
            <ul>
                <li><NavLink to="/dashboard" activeClassName="active-link">Dashboard</NavLink></li>
                <li><NavLink to="/jobs" activeClassName="active-link">Jobs</NavLink></li>
                <li><NavLink to="/recommendations" activeClassName="active-link">AI Recommendations</NavLink></li>
                <li><NavLink to="/profile" activeClassName="active-link">Profile</NavLink></li>
                <li><NavLink to="/preferences" activeClassName="active-link">Preferences</NavLink></li>
            </ul>

            <div className="subscription-container">
                <div className="subscription-info">
                    <p>Credits: <strong>{credits}</strong></p>
                    <p>Subscription Status: <strong>{isSubscribed ? 'Active' : 'Inactive'}</strong></p>
                </div>

                <div className="button-container">
                    <button onClick={handleUnsubscribe} disabled={!isSubscribed} className="unsubscribe-button">
                        Unsubscribe
                    </button>
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Sidebar;