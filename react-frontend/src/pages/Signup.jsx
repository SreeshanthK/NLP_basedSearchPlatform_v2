import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signupUser } from '../services/authService';
import ErrorDialog from '../components/ErrorDialog';
const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
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
            const { confirmPassword, ...signupData } = formData;
            const response = await signupUser(signupData);
            if (response.success) {
                navigate('/verify-otp', {
                    state: {
                        userId: response.userId,
                        email: signupData.email
                    }
                });
            } else {
                handleSignupError(response.message || 'Signup failed', response);
            }
        } catch (error) {
            handleSignupError(error.message || 'An error occurred during signup', error);
        } finally {
            setLoading(false);
        }
    };
    const validateForm = () => {
        const errors = [];
        if (!formData.name.trim()) {
            errors.push('Name is required');
        } else if (formData.name.trim().length < 2) {
            errors.push('Name must be at least 2 characters long');
        }
        if (!formData.email.trim()) {
            errors.push('Email is required');
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.push('Please enter a valid email address');
        }
        if (!formData.password) {
            errors.push('Password is required');
        } else if (formData.password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        } else {
            if (!/(?=.*[A-Z])/.test(formData.password)) {
                errors.push('Password must contain at least one uppercase letter');
            }
            if (!/(?=.*[a-z])/.test(formData.password)) {
                errors.push('Password must contain at least one lowercase letter');
            }
            if (!/(?=.*\d)/.test(formData.password)) {
                errors.push('Password must contain at least one number');
            }
        }
        if (!formData.confirmPassword) {
            errors.push('Please confirm your password');
        } else if (formData.password !== formData.confirmPassword) {
            errors.push('Passwords do not match');
        }
        return errors;
    };
    const handleSignupError = (message, errorData) => {
        if (message.toLowerCase().includes('email already exists') ||
            message.toLowerCase().includes('user with this email already exists')) {
            setErrorDialog({
                isOpen: true,
                title: 'Account Already Exists',
                message: 'An account with this email address already exists.',
                details: 'Please try logging in instead or use a different email address.'
            });
        } else if (message.toLowerCase().includes('network') ||
                   message.toLowerCase().includes('connection')) {
            setErrorDialog({
                isOpen: true,
                title: 'Connection Error',
                message: 'Unable to connect to the server.',
                details: 'Please check your internet connection and try again.'
            });
        } else {
            setError(message || 'An error occurred during signup. Please try again.');
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{' '}
                        <Link
                            to="/login"
                            className="font-medium text-blue-600 hover:text-blue-500"
                        >
                            sign in to your existing account
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
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Full name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                autoComplete="name"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Enter your full name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
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
                                autoComplete="new-password"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
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
                                    Creating account...
                                </div>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                        By creating an account, you automatically get customer access.
                    </div>
                </form>
                <ErrorDialog
                    isOpen={errorDialog.isOpen}
                    onClose={() => setErrorDialog({ isOpen: false, title: '', message: '', details: '' })}
                    title={errorDialog.title}
                    message={errorDialog.message}
                    details={errorDialog.details}
                />
            </div>
        </div>
    );
};
export default Signup;
