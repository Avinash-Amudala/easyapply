// src/components/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
    return (
        <div className="landing-page">
            <header className="landing-header">
                <h1>🚀 EasyApply</h1>
                <p>Effortlessly track, manage, and optimize your job applications.</p>
                <div className="landing-buttons">
                    <Link to="/login" className="landing-btn primary">Login</Link>
                    <Link to="/register" className="landing-btn secondary">Register</Link>
                </div>
            </header>

            <section className="features">
                <h2>Why Choose EasyApply?</h2>
                <div className="features-list">
                    <div className="feature-item">
                        <h3>📊 Track Applications</h3>
                        <p>Monitor your job applications in one centralized dashboard.</p>
                    </div>
                    <div className="feature-item">
                        <h3>🔍 Get Insights</h3>
                        <p>Analyze application trends and optimize your job hunt.</p>
                    </div>
                    <div className="feature-item">
                        <h3>💎 Premium Access</h3>
                        <p>Unlock exclusive features with our subscription plans.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default LandingPage;
