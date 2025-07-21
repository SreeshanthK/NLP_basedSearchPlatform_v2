import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/api';
import ErrorDialog from '../components/ErrorDialog';
import SuccessDialog from '../components/SuccessDialog';
const ResetPassword = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorDialog, setErrorDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    details: ''
  });
  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    title: '',
    message: ''
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  useEffect(() => {
    if (!token) {
      setErrorDialog({
        isOpen: true,
        title: 'Invalid Reset Link',
        message: 'This password reset link is invalid or missing.',
        details: 'Please request a new password reset from the login page.'
      });
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [token, navigate]);
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errorDialog.isOpen) {
      setErrorDialog({ isOpen: false, title: '', message: '', details: '' });
    }
  };
  const validatePasswords = () => {
    const errors = [];
    if (!formData.newPassword.trim()) {
      errors.push('New password is required');
    } else if (formData.newPassword.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
    if (!formData.confirmPassword.trim()) {
      errors.push('Please confirm your password');
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }
    return errors;
  };
  const handleResetError = (error) => {
    const errorMessage = error.response?.data?.message || error.message;
    if (errorMessage.includes('expired') || errorMessage.includes('invalid token')) {
      setErrorDialog({
        isOpen: true,
        title: 'Reset Link Expired',
        message: 'This password reset link has expired or is invalid.',
        details: 'Please request a new password reset from the login page. Reset links are valid for 1 hour.'
      });
    } else if (errorMessage.includes('not found')) {
      setErrorDialog({
        isOpen: true,
        title: 'Invalid Reset Request',
        message: 'Unable to find a valid reset request.',
        details: 'Please request a new password reset from the login page.'
      });
    } else if (error.code === 'NETWORK_ERROR') {
      setErrorDialog({
        isOpen: true,
        title: 'Connection Error',
        message: 'Unable to connect to the server.',
        details: 'Please check your internet connection and try again.'
      });
    } else {
      setErrorDialog({
        isOpen: true,
        title: 'Reset Failed',
        message: errorMessage || 'Failed to reset password.',
        details: 'Please try again. If the problem persists, request a new reset link.'
      });
    }
  };
  const handleSuccessDialogAction = () => {
    setSuccessDialog({ isOpen: false, title: '', message: '' });
    navigate('/login');
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validatePasswords();
    if (validationErrors.length > 0) {
      setErrorDialog({
        isOpen: true,
        title: 'Please Check Your Input',
        message: 'Please correct the following errors:',
        details: validationErrors.join(', ')
      });
      return;
    }
    setLoading(true);
    try {
      const response = await authService.post('/api/auth/reset-password', {
        token,
        newPassword: formData.newPassword
      });
      if (response.data.success) {
        setSuccessDialog({
          isOpen: true,
          title: 'Password Reset Successfully!',
          message: 'Your password has been reset. You can now log in with your new password.',
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      handleResetError(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="newPassword" className="sr-only">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="New password"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
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
      <SuccessDialog
        isOpen={successDialog.isOpen}
        onClose={() => setSuccessDialog({ isOpen: false, title: '', message: '' })}
        title={successDialog.title}
        message={successDialog.message}
        actionText="Go to Login"
        onAction={handleSuccessDialogAction}
      />
    </div>
  );
};
export default ResetPassword;
