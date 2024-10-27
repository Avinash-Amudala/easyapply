// src/components/SubscriptionOptions.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { updateSubscription } from '../api';

function SubscriptionOptions({ onSubscribe }) {
    const navigate = useNavigate();

    const handleSubscription = async (plan) => {
        try {
            await updateSubscription(plan); // Assume this updates the subscription in the backend
            alert(`Subscribed to ${plan} plan!`);
            onSubscribe();  // Notify App.js of subscription success
            navigate('/dashboard'); // Redirect to the dashboard
        } catch (error) {
            console.error('Subscription error:', error);
            alert('Failed to subscribe');
        }
    };

    return (
        <div>
            <h2>Choose a Subscription Plan</h2>
            <button onClick={() => handleSubscription('basic')}>Basic Plan - $150</button>
            <button onClick={() => handleSubscription('pro')}>Pro Plan - $300</button>
            <button onClick={() => handleSubscription('premium')}>Premium Plan - $400</button>
        </div>
    );
}

export default SubscriptionOptions;
