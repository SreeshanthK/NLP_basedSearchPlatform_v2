import axios from 'axios';

const API_BASE_URL = 'https://search-relevance-optimizer-backend.onrender.com/';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {

            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const signupUser = async (userData) => {
    try {
        const response = await api.post('/auth/signup', userData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Signup failed');
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Login failed');
    }
};

export const getUserProfile = async () => {
    try {
        const response = await api.get('/auth/profile');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
};

export const logoutUser = async () => {
    try {
        const response = await api.post('/auth/logout');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Logout failed');
    }
};

export const verifyOTP = async (email, otp) => {
    try {
        const response = await api.post('/auth/verify-otp', { email, otp });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'OTP verification failed');
    }
};

export const resendOTP = async (email) => {
    try {
        const response = await api.post('/auth/resend-otp', { email });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to resend OTP');
    }
};

export const requestPasswordReset = async (email) => {
    try {
        const response = await api.post('/auth/request-password-reset', { email });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to send password reset OTP');
    }
};

export const resetPassword = async (email, otp, newPassword) => {
    try {
        const response = await api.post('/auth/reset-password', { email, otp, newPassword });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Password reset failed');
    }
};
