import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import LandingPage from './components/LandingPage';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import Jobs from './components/Jobs';
import Profile from './components/Profile';
import Preferences from './components/Preferences';
import SubscriptionOptions from './components/SubscriptionOptions';
import Layout from './components/Layout';
import API from './api';
import AssistantDashboard from "./components/AssistantDashboard";
import AdminDashboard from "./components/AdminDashboard";
import Recommendations from './components/Recommendations';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [credits, setCredits] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;

        const verifySession = async () => {
            try {
                const sessionResponse = await API.get('/auth/session');
                if (sessionResponse.data.isAuthenticated) {
                    const subResponse = await API.get('/auth/check-subscription');
                    if (isMounted) {
                        setIsLoggedIn(true);
                        setIsSubscribed(subResponse.data.isSubscribed);
                        setCredits(subResponse.data.credits);
                    }
                }
            } catch (error) {
                if (isMounted) {
                    setIsLoggedIn(false);
                    setIsSubscribed(false);
                    setCredits(0);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        verifySession();

        const handleLogout = () => {
            setIsLoggedIn(false);
            setIsSubscribed(false);
            setCredits(0);
            navigate('/login');
        };

        window.addEventListener('logout', handleLogout);

        return () => {
            isMounted = false;
            window.removeEventListener('logout', handleLogout);
        };
    }, [navigate]);

    if (loading) {
        return <div className="loading-screen">Loading...</div>;
    }

    return (
        <div className="App">
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/assistant-dashboard" element={<AssistantDashboard />} />
                <Route
                    path="/login"
                    element={isLoggedIn ? <Navigate to="/dashboard" /> : <LoginForm onLoginSuccess={() => setIsLoggedIn(true)} />}
                />
                <Route path="/register" element={<RegisterForm />} />
                <Route
                    path="/subscription"
                    element={isLoggedIn ? <SubscriptionOptions onSubscribe={() => setIsSubscribed(true)} /> : <Navigate to="/login" />}
                />
                <Route element={<Layout isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}>
                    <Route path="/dashboard" element={<Dashboard credits={credits} />} />
                    <Route path="/jobs" element={<Jobs credits={credits} />} />
                    <Route path="/recommendations" element={<Recommendations />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/preferences" element={<Preferences />} />
                </Route>
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </div>
    );
}

export default App;