import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as authService from '../services/authService';
import ErrorDialog from '../components/ErrorDialog';
import SuccessDialog from '../components/SuccessDialog';
const ResetPasswordOTP = () => {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
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
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);
  const validatePassword = (password) => {
    return password.length >= 6;
  };
  const handleResetError = (error) => {
    const errorMessage = error.message;
    if (errorMessage.includes('Invalid or expired OTP')) {
      setErrorDialog({
        isOpen: true,
        title: 'Invalid OTP',
        message: 'The OTP you entered is invalid or has expired.',
        details: 'Please check the OTP and try again, or request a new one.'
      });
    } else if (errorMessage.includes('User not found')) {
      setErrorDialog({
        isOpen: true,
        title: 'Account Error',
        message: 'Unable to find your account.',
        details: 'Please try the password reset process again.'
      });
    } else {
      setErrorDialog({
        isOpen: true,
        title: 'Reset Failed',
        message: errorMessage || 'Failed to reset password.',
        details: 'Please check your information and try again.'
      });
    }
  };
  const handleResendOTP = async () => {
    setResendLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setCountdown(60);
    } catch (error) {
      console.error('Resend OTP error:', error);
      setErrorDialog({
        isOpen: true,
        title: 'Resend Failed',
        message: 'Failed to resend OTP.',
        details: 'Please try again in a few moments.'
      });
    } finally {
      setResendLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrorDialog({
        isOpen: true,
        title: 'OTP Required',
        message: 'Please enter the OTP sent to your email.',
        details: 'Check your email inbox and spam folder for the OTP.'
      });
      return;
    }
    if (!newPassword.trim()) {
      setErrorDialog({
        isOpen: true,
        title: 'Password Required',
        message: 'Please enter your new password.',
        details: 'Your password must be at least 6 characters long.'
      });
      return;
    }
    if (!validatePassword(newPassword)) {
      setErrorDialog({
        isOpen: true,
        title: 'Invalid Password',
        message: 'Password must be at least 6 characters long.',
        details: 'Please choose a stronger password.'
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorDialog({
        isOpen: true,
        title: 'Passwords Don\'t Match',
        message: 'The passwords you entered don\'t match.',
        details: 'Please make sure both password fields are identical.'
      });
      return;
    }
    setLoading(true);
    try {
      const response = await authService.resetPassword(email, otp, newPassword);
      if (response.success) {
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
  if (!email) {
    return null;
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the OTP sent to <span className="font-medium">{email}</span> and your new password.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Enter OTP
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                autoComplete="one-time-code"
                required
                maxLength="6"
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendLoading || countdown > 0}
              className="text-sm text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendLoading
                ? 'Sending...'
                : countdown > 0
                  ? `Resend OTP in ${countdown}s`
                  : 'Resend OTP'
              }
            </button>
            <div>
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Sign In
              </Link>
            </div>
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
        onClose={() => {
          setSuccessDialog({ isOpen: false, title: '', message: '' });
          navigate('/login');
        }}
        title={successDialog.title}
        message={successDialog.message}
        actionText="Go to Login"
        onAction={() => {
          setSuccessDialog({ isOpen: false, title: '', message: '' });
          navigate('/login');
        }}
      />
    </div>
  );
};
export default ResetPasswordOTP;
