// src/components/LoginForm.js
import React, { useState } from 'react';
import { login } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import './AuthForm.css';

function LoginForm({ onLoginSuccess }) {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await login(formData);
            localStorage.setItem('token', response.data.token);
            alert('Login successful!');
            onLoginSuccess();
            navigate('/dashboard');
        } catch (error) {
            console.error('Login error:', error.response ? error.response.data : error.message);
            alert('Error during login');
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
            <form onSubmit={handleSubmit}>
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
