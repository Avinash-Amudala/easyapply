// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import Jobs from './components/Jobs';
import Profile from './components/Profile';
import Preferences from './components/Preferences';
import SubscriptionOptions from './components/SubscriptionOptions';
import Sidebar from './components/Sidebar';
import { checkSubscriptionStatus } from './api';

function App() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSubscription = async () => {
            if (isLoggedIn) {
                try {
                    const status = await checkSubscriptionStatus();
                    setIsSubscribed(status);
                } catch (error) {
                    console.error('Error checking subscription:', error);
                }
            } else {
                setIsSubscribed(false); // Ensure subscription is false if not logged in
            }
            setLoading(false);
        };
        checkSubscription();
    }, [isLoggedIn]);

    const handleLoginSuccess = () => {
        setIsLoggedIn(true);
    };

    const handleSubscriptionSuccess = () => {
        setIsSubscribed(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setIsSubscribed(false);
    };

    if (loading) {
        return <div className="loading-screen">Loading...</div>;
    }

    return (
        <Router>
            <div className="App">
                {/* Conditionally render Sidebar only when logged in and subscribed */}
                {isLoggedIn && isSubscribed ? <Sidebar onLogout={handleLogout} /> : null}
                <div className={`main-content ${isLoggedIn && isSubscribed ? '' : 'no-sidebar'}`}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/register" element={<RegisterForm />} />
                        <Route path="/login" element={<LoginForm onLoginSuccess={handleLoginSuccess} />} />

                        {/* Subscription Route */}
                        <Route
                            path="/subscription"
                            element={
                                isLoggedIn && !isSubscribed ? (
                                    <SubscriptionOptions onSubscribe={handleSubscriptionSuccess} />
                                ) : (
                                    <Navigate to={isLoggedIn ? "/dashboard" : "/login"} />
                                )
                            }
                        />

                        {/* Protected Routes */}
                        <Route
                            path="/dashboard"
                            element={
                                isLoggedIn ? (
                                    isSubscribed ? (
                                        <Dashboard />
                                    ) : (
                                        <Navigate to="/subscription" />
                                    )
                                ) : (
                                    <Navigate to="/login" />
                                )
                            }
                        />
                        <Route
                            path="/jobs"
                            element={
                                isLoggedIn ? (
                                    isSubscribed ? (
                                        <Jobs />
                                    ) : (
                                        <Navigate to="/subscription" />
                                    )
                                ) : (
                                    <Navigate to="/login" />
                                )
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                isLoggedIn ? (
                                    isSubscribed ? (
                                        <Profile />
                                    ) : (
                                        <Navigate to="/subscription" />
                                    )
                                ) : (
                                    <Navigate to="/login" />
                                )
                            }
                        />
                        <Route
                            path="/preferences"
                            element={
                                isLoggedIn ? (
                                    isSubscribed ? (
                                        <Preferences />
                                    ) : (
                                        <Navigate to="/subscription" />
                                    )
                                ) : (
                                    <Navigate to="/login" />
                                )
                            }
                        />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
