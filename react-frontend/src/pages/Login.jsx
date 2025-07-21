import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/authService';
import ErrorDialog from '../components/ErrorDialog';
const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [errorDialog, setErrorDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        details: ''
    });
    const { login } = useAuth();
    const navigate = useNavigate();
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError('');
        if (errorDialog.isOpen) {
            setErrorDialog({ isOpen: false, title: '', message: '', details: '' });
        }
    };
    const validateForm = () => {
        const errors = [];
        if (!formData.email.trim()) {
            errors.push('Email is required');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.push('Please enter a valid email address');
        }
        if (!formData.password.trim()) {
            errors.push('Password is required');
        }
        return errors;
    };
    const handleLoginError = (error, response = null) => {
        if (response?.message === 'User not found') {
            setErrorDialog({
                isOpen: true,
                title: 'Account Not Found',
                message: 'No account found with this email address.',
                details: 'Please check your email or create a new account if you don\'t have one.'
            });
        } else if (error.code === 'NETWORK_ERROR') {
            setErrorDialog({
                isOpen: true,
                title: 'Connection Error',
                message: 'Unable to connect to the server.',
                details: 'Please check your internet connection and try again.'
            });
        } else {
            const errorMessage = response?.message === 'Invalid credentials'
                ? 'Invalid email or password. Please check your credentials and try again.'
                : error.message || 'Login failed. Please try again.';
            setError(errorMessage);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            setError(validationErrors.join(', '));
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await loginUser(formData);
            if (response.success) {
                login(response.user, response.token);
                navigate('/');
            } else {
                if (response.requiresVerification && response.userId) {
                    setErrorDialog({
                        isOpen: true,
                        title: 'Email Verification Required',
                        message: 'Your email address has not been verified.',
                        details: 'Please check your email and verify your account, or we can redirect you to the verification page.'
                    });
                    setTimeout(() => {
                        navigate('/verify-otp', {
                            state: {
                                userId: response.userId,
                                email: formData.email
                            }
                        });
                    }, 3000);
                } else {
                    handleLoginError(new Error(response.message), response);
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            handleLoginError(error);
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link
                            to="/signup"
                            className="font-medium text-blue-600 hover:text-blue-500"
                        >
                            create a new account
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-blue-600 hover:text-blue-500"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Signing in...
                                </div>
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <ErrorDialog
                isOpen={errorDialog.isOpen}
                onClose={() => setErrorDialog({ isOpen: false, title: '', message: '', details: '' })}
                title={errorDialog.title}
                message={errorDialog.message}
                details={errorDialog.details}
            />
        </div>
    );
};
export default Login;
