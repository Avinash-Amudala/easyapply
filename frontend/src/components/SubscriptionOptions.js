import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateSubscription } from '../api';

function SubscriptionOptions({ onSubscribe }) {
    const navigate = useNavigate();

    useEffect(() => {
        console.log("User authentication state in SubscriptionOptions");
    }, []);

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
                    <button onClick={() => handleSubscription('basic')}>Subscribe</button>
                </div>
                <div className="plan-card">
                    <h3>Pro Plan</h3>
                    <button onClick={() => handleSubscription('pro')}>Subscribe</button>
                </div>
                <div className="plan-card">
                    <h3>Premium Plan</h3>
                    <button onClick={() => handleSubscription('premium')}>Subscribe</button>
                </div>
            </div>
        </div>
    );
}

export default SubscriptionOptions;
