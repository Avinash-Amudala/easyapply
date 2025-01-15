// src/components/SubscriptionOptions.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { updateSubscription } from '../api';
import './SubscriptionOptions.css';

function SubscriptionOptions({ onSubscribe }) {
    const navigate = useNavigate();

    const handleSubscription = async (plan) => {
        try {
            const response = await updateSubscription(plan);
            console.log('Subscription successful:', response);
            alert(`Subscribed to ${plan} plan!`);
            onSubscribe();
            navigate('/dashboard');
        } catch (error) {
            console.error('Subscription error:', error.response?.data || error.message);
            alert(`Failed to subscribe. Reason: ${error.response?.data?.message || 'Unknown error'}`);
        }
    };

    return (
        <div className="subscription-container">
            <h2>Choose Your Plan</h2>
            <div className="plans">
                <div className="plan-card">
                    <h3>Basic Plan</h3>
                    <p>$150</p>
                    <p>200 Applications</p>
                    <button onClick={() => handleSubscription('basic')}>Subscribe</button>
                </div>
                <div className="plan-card">
                    <h3>Pro Plan</h3>
                    <p>$300</p>
                    <p>500 Applications</p>
                    <button onClick={() => handleSubscription('pro')}>Subscribe</button>
                </div>
                <div className="plan-card">
                    <h3>Premium Plan</h3>
                    <p>$400</p>
                    <p>1000 Applications</p>
                    <button onClick={() => handleSubscription('premium')}>Subscribe</button>
                </div>
            </div>
        </div>
    );
}

export default SubscriptionOptions;
