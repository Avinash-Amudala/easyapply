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
        const response = await API.post('/auth/update-subscription', { plan });
        return response.data;
    } catch (error) {
        console.error('Error updating subscription:', error.response?.data || error.message);
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

export const deleteJob = async (id) => {
    try {
        await API.delete(`/jobs/${id}`);
    } catch (error) {
        console.error('Error deleting job:', error);
        throw error;
    }
};
