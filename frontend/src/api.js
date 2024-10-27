// src/api.js
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5001/api' });

API.interceptors.request.use(req => {
    const token = localStorage.getItem('token');
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
});

export const register = (formData) => API.post('/auth/register', formData);
export const login = (formData) => API.post('/auth/login', formData);

export const checkSubscriptionStatus = async () => {
    try {
        const response = await API.get('/auth/check-subscription');
        return response.data.isSubscribed;
    } catch (error) {
        console.error('Error checking subscription status:', error);
        return false;
    }
};

export const updateSubscription = async (plan) => {
    try {
        await API.post('/auth/subscribe', { plan });
    } catch (error) {
        console.error('Subscription update error:', error);
        throw error;
    }
};

export const getJobs = async () => {
    try {
        const response = await API.get('/jobs');
        return response.data;
    } catch (error) {
        console.error('Error fetching jobs:', error);
        throw error;
    }
};

// Profile APIs
export const getUserProfile = async () => {
    const response = await API.get('/auth/profile');
    return response.data;
};

export const updateUserProfile = async (profileData) => {
    await API.put('/auth/profile', profileData);
};
