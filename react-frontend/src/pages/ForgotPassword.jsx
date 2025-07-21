import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';
import ErrorDialog from '../components/ErrorDialog';
import SuccessDialog from '../components/SuccessDialog';
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
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
  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };
  const handlePasswordResetError = (error) => {
    const errorMessage = error.message;
    if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
      setErrorDialog({
        isOpen: true,
        title: 'Email Not Found',
        message: 'No account found with this email address.',
        details: 'Please check your email address or create a new account if you don\'t have one.'
      });
    } else if (errorMessage.includes('rate limit')) {
      setErrorDialog({
        isOpen: true,
        title: 'Too Many Requests',
        message: 'You have requested too many password resets.',
        details: 'Please wait a few minutes before requesting another reset OTP.'
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
        message: errorMessage || 'Failed to send password reset OTP.',
        details: 'Please try again. If the problem persists, contact support.'
      });
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
      if (!email.trim()) {
      setErrorDialog({
        isOpen: true,
        title: 'Email Required',
        message: 'Please enter your email address.',
        details: 'We need your email address to send you the password reset OTP.'
      });
      return;
    }    if (!validateEmail(email)) {
      setErrorDialog({
        isOpen: true,
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
        details: 'Make sure your email address is in the correct format (e.g., user@example.com).'
      });
      return;
    }
    setLoading(true);
    try {
      const response = await authService.requestPasswordReset(email);
      if (response.success) {
        navigate('/reset-password-otp', {
          state: {
            email: email,
            message: response.message
          }
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      handlePasswordResetError(error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset OTP'}
            </button>
          </div>
          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Sign In
            </Link>
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
        actionText="Back to Login"
        onAction={() => {
          setSuccessDialog({ isOpen: false, title: '', message: '' });
        }}
      />
    </div>
  );
};
export default ForgotPassword;
