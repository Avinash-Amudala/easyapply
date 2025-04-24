import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
const API = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' }
});

// CSRF Token Handling
let csrfToken = null;

const fetchCsrfToken = async () => {
    try {
        const response = await API.get('/csrf-token', { withCredentials: true });
        csrfToken = response.data.csrfToken;
        console.log("✅ CSRF Token fetched:", csrfToken);
    } catch (error) {
        console.error("❌ Error fetching CSRF token:", error);
    }
};

API.interceptors.request.use(async (config) => {
    let token = localStorage.getItem('token') ||
        document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

    if (!csrfToken && config.method !== 'get') {
        await fetchCsrfToken();
    }

    if (csrfToken && config.method !== 'get') {
        config.headers['X-CSRF-Token'] = csrfToken;
    }

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
}, (error) => Promise.reject(error));

API.interceptors.response.use(response => response, async (error) => {
    if (error.response && error.response.status === 401 && window.location.pathname !== '/login') {
        console.warn("⚠️ Unauthorized - Redirecting to Login...");
        localStorage.removeItem('token');
        window.location.href = "/login";
    }
    return Promise.reject(error);
});

// Authentication APIs
export const register = (formData) => API.post('/auth/register', formData);
export const login = async (formData) => {
    try {
        console.log("📤 Login Request Sent:", formData);
        const response = await API.post('/auth/login', formData);
        if (response.data.token) {
            console.log("✅ Token received:", response.data.token);
            localStorage.setItem('token', response.data.token);
        } else {
            console.error("❌ No token received from API response");
        }
        return response.data;
    } catch (error) {
        console.error("❌ Login error:", error.response?.data || error.message);
        throw error;
    }
};

export const logout = async (onLogoutCallback) => {
    try {
        await API.post('/auth/logout');
    } catch (error) {
        console.error("❌ Logout error:", error);
    } finally {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie = "token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "XSRF-TOKEN=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        if (window.chrome?.runtime) {
            window.chrome.runtime.sendMessage(
                'kbkjjklbejbbheenhldadfbllnodkmeh',
                { action: 'setToken', token: null }
            );
        }
        window.dispatchEvent(new Event('logout'));
        if (onLogoutCallback) onLogoutCallback();
    }
};

// User Session & Subscription APIs
export const checkSession = async () => {
    try {
        const response = await API.get('/auth/session');
        return {
            isAuthenticated: response.data.isAuthenticated,
            user: response.data.user
        };
    } catch (error) {
        console.error("Session check failed:", error);
        return { isAuthenticated: false };
    }
};

export const checkSubscriptionAndCredits = async () => {
    try {
        const response = await API.get('/auth/check-subscription');
        localStorage.setItem('isSubscribed', response.data.isSubscribed);
        localStorage.setItem('credits', response.data.credits);
        return response.data;
    } catch (error) {
        console.error('Error fetching subscription status:', error);
        return { isSubscribed: false, credits: 0 };
    }
};

export const updateSubscription = async (plan) => {
    try {
        const response = await API.post('/auth/subscribe', { plan });
        console.log("✅ Subscription Updated:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Subscription Update Failed:", error.response?.data || error.message);
        throw error;
    }
};

// Job APIs
export const getJobs = async () => {
    try {
        const response = await API.get('/jobs');
        return {
            saved: response.data.saved || [],
            delegated: response.data.delegated || [],
            applied: response.data.applied || []
        };
    } catch (error) {
        console.error("Error fetching jobs:", error);
        return { saved: [], delegated: [], applied: [] };
    }
};

export const addSavedJob = async (jobData) => {
    try {
        const response = await API.post('/jobs/saved', jobData);
        return response.data;
    } catch (error) {
        console.error("Error saving job:", error);
        throw error;
    }
};

export const delegateJob = async (jobData) => {
    try {
        const response = await API.post('/jobs/delegate', jobData);
        return response.data;
    } catch (error) {
        console.error("Error delegating job:", error);
        throw error;
    }
};

export const deleteJob = async (id) => {
    try {
        await API.delete(`/jobs/${id}`);
        console.log("✅ Job deleted successfully.");
    } catch (error) {
        console.error("❌ Error deleting job:", error.response?.data || error.message);
        throw error;
    }
};

// Admin APIs
export const getAllUsers = async () => {
    try {
        const response = await API.get('/admin/users');
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

export const getAllAssistants = async () => {
    try {
        const response = await API.get('/admin/assistants');
        return response.data;
    } catch (error) {
        console.error("Error fetching assistants:", error);
        throw error;
    }
};

export const createAssistant = async (assistantData) => {
    try {
        const response = await API.post('/admin/assistants', assistantData);
        return response.data;
    } catch (error) {
        console.error("❌ Error creating assistant:", error.response?.data || error.message);
        throw error;
    }
};

export const assignAssistant = async (assignmentData) => {
    try {
        const response = await API.post('/admin/assign', assignmentData);
        return response.data;
    } catch (error) {
        console.error("Error assigning assistant:", error);
        throw error;
    }
};

export const getAssistantProgress = async (assistantId) => {
    try {
        const response = await API.get(`/admin/progress/${assistantId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching assistant progress:", error);
        throw error;
    }
};

// Assistant APIs
export const getAssignedJobs = async () => {
    try {
        const response = await API.get('/assistant/jobs');
        return response.data;
    } catch (error) {
        console.error("Error fetching assigned jobs:", error);
        throw error;
    }
};

export const updateJobStatus = async (jobId, formData) => {
    try {
        const response = await API.put(`/assistant/jobs/${jobId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        throw error;
    }
};

export const trackActivity = async (activityData) => {
    try {
        const response = await API.post('/activity/track', activityData);
        return response.data;
    } catch (error) {
        console.error('Activity tracking failed:', error);
        throw error;
    }
};

// Profile APIs
export const getUserProfile = async () => {
    try {
        const response = await API.get('/auth/profile');
        return response.data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
};

export const updateUserProfile = async (profileData) => {
    try {
        const response = await API.put('/auth/profile', profileData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

// Activity Tracking
export const trackJobView = async (jobId) => {
    await API.post('/activity', { type: 'view', jobId });
};

export const trackJobApplication = async (jobId) => {
    await API.post('/activity', { type: 'application', jobId });
};

export const createJobAlert = async (alertConfig) => {
    return API.post('/alerts/jobs', alertConfig);
};

export default API;