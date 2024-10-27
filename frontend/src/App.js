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

    useEffect(() => {
        const checkSubscription = async () => {
            if (isLoggedIn) {
                const status = await checkSubscriptionStatus();
                setIsSubscribed(status);
            }
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

    return (
        <Router>
            <div className="App">
                {isLoggedIn && isSubscribed && <Sidebar onLogout={handleLogout} />}
                <div className="main-content">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/register" element={<RegisterForm />} />
                        <Route path="/login" element={<LoginForm onLoginSuccess={handleLoginSuccess} />} />
                        <Route
                            path="/subscription"
                            element={
                                isLoggedIn && !isSubscribed ? (
                                    <SubscriptionOptions onSubscribe={handleSubscriptionSuccess} />
                                ) : (
                                    <Navigate to="/dashboard" />
                                )
                            }
                        />
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
                            element={isLoggedIn ? <Profile /> : <Navigate to="/login" />}
                        />
                        <Route
                            path="/preferences"
                            element={isLoggedIn ? <Preferences /> : <Navigate to="/login" />}
                        />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;
