import React, { useEffect, useState } from 'react';
import { login } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';

function LoginForm({ onLoginSuccess }) {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        if (localStorage.getItem('token')) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            console.log("📤 Sending Login Request:", formData);
            const response = await login(formData);

            if (response.token) {
                console.log("✅ Token received:", response.token);
                localStorage.setItem('token', response.token);
                localStorage.setItem('role', response.role);

                alert('🎉 Login successful!');

                onLoginSuccess();

                // Post login event for browser extension
                window.postMessage({
                    type: 'EXTENSION_AUTH',
                    token: response.token,
                    role: response.role
                }, '*');

                // Handle Chrome Extension authentication (if applicable)
                let chrome;
                if (chrome?.runtime?.id) {
                    chrome.runtime.sendMessage({
                        action: 'setToken',
                        token: response.token,
                        role: response.role
                    });
                }

                // Redirect user based on role
                setTimeout(() => {
                    if (response.role === "admin") {
                        navigate('/admin-dashboard');
                    } else if (response.role === "assistant") {
                        navigate('/assistant-dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                }, 500);
            } else {
                setError("❌ No token received. Please try again.");
            }
        } catch (error) {
            console.error('❌ Login error:', error.response?.data || error.message);
            setError("Invalid credentials. Please check your email or password.");
        }
    };

    const handleSocialLogin = (provider) => {
        alert(`Login with ${provider} is currently under development.`);
    };

    return (
        <div className="auth-container">
            <div className="auth-header">
                <h1>EasyApply</h1>
                <h2>Login to Your Account</h2>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                {error && <p className="auth-error">{error}</p>}
                <button type="submit" className="login-button">Login</button>
            </form>
            <div className="social-login">
                <button className="social-button google" onClick={() => handleSocialLogin('Google')}>
                    Login with Google
                </button>
                <button className="social-button facebook" onClick={() => handleSocialLogin('Facebook')}>
                    Login with Facebook
                </button>
            </div>
            <div className="auth-switch">
                Don't have an account? <Link to="/register">Register here</Link>
            </div>
        </div>
    );
}

export default LoginForm;
