// src/components/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
    return (
        <div className="landing-page">
            <header className="landing-header">
                <h1>EasyApply</h1>
                <p>Your one-stop solution for job applications and tracking.</p>
                <div className="landing-buttons">
                    <Link to="/login" className="landing-btn">Login</Link>
                    <Link to="/register" className="landing-btn">Register</Link>
                </div>
            </header>
            <section className="features">
                <h2>Why Choose EasyApply?</h2>
                <div className="features-list">
                    <div className="feature-item">
                        <h3>Track Applications</h3>
                        <p>Easily manage and track all your job applications in one place.</p>
                    </div>
                    <div className="feature-item">
                        <h3>Get Insights</h3>
                        <p>Analyze your application statistics and optimize your strategy.</p>
                    </div>
                    <div className="feature-item">
                        <h3>Subscription Plans</h3>
                        <p>Choose a plan that fits your needs and access premium features.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default LandingPage;
