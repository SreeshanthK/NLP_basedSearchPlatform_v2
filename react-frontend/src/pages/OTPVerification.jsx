import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/api';
import ErrorDialog from '../components/ErrorDialog';
import SuccessDialog from '../components/SuccessDialog';
const OTPVerification = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
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
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const userId = location.state?.userId;
  const email = location.state?.email;
  useEffect(() => {
    if (!userId) {
      setErrorDialog({
        isOpen: true,
        title: 'Missing Information',
        message: 'Required verification information is missing.',
        details: 'Please start the signup process again to receive your verification code.'
      });
      setTimeout(() => navigate('/signup'), 3000);
      return;
    }
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [userId, navigate]);
  const handleOTPError = (error, context = 'verification') => {
    const errorMessage = error.response?.data?.message || error.message;
    if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
      setErrorDialog({
        isOpen: true,
        title: 'Invalid or Expired OTP',
        message: 'The verification code you entered is either invalid or has expired.',
        details: 'Please request a new verification code and try again. OTP codes are valid for 10 minutes.'
      });
    } else if (errorMessage.includes('not found')) {
      setErrorDialog({
        isOpen: true,
        title: 'User Not Found',
        message: 'Unable to find your account for verification.',
        details: 'Please ensure you are using the correct email address or start the signup process again.'
      });
    } else if (context === 'resend' && errorMessage.includes('rate limit')) {
      setErrorDialog({
        isOpen: true,
        title: 'Too Many Requests',
        message: 'You have requested too many verification codes.',
        details: 'Please wait a few minutes before requesting another code.'
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
        title: context === 'resend' ? 'Resend Failed' : 'Verification Failed',
        message: errorMessage || `Failed to ${context === 'resend' ? 'resend OTP' : 'verify OTP'}`,
        details: 'Please try again. If the problem persists, contact support.'
      });
    }
  };
  const handleSuccessDialogAction = () => {
    setSuccessDialog({ isOpen: false, title: '', message: '' });
    navigate('/');
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setErrorDialog({
        isOpen: true,
        title: 'Invalid OTP Format',
        message: 'Please enter a valid 6-digit verification code.',
        details: 'The code should contain only numbers and be exactly 6 digits long.'
      });
      return;
    }
    setLoading(true);
    try {
      const response = await authService.post('/api/auth/verify-otp', {
        userId,
        otp
      });
      if (response.data.success) {
        setSuccessDialog({
          isOpen: true,
          title: 'Email Verified Successfully!',
          message: 'Your email has been verified and your account is now active.'
        });
        setTimeout(() => {
          login(response.data.token, response.data.user);
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      handleOTPError(error, 'verification');
    } finally {
      setLoading(false);
    }
  };
  const handleResendOTP = async () => {
    if (resendTimer > 0) {
      setErrorDialog({
        isOpen: true,
        title: 'Please Wait',
        message: `You can request a new verification code in ${resendTimer} seconds.`,
        details: 'This helps prevent spam and ensures system security.'
      });
      return;
    }
    setResendLoading(true);
    try {
      const response = await authService.post('/api/auth/resend-otp', {
        userId
      });
      if (response.data.success) {
        setSuccessDialog({
          isOpen: true,
          title: 'New Code Sent!',
          message: 'A new verification code has been sent to your email.'
        });
        setResendTimer(60);
        const timer = setInterval(() => {
          setResendTimer(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      handleOTPError(error, 'resend');
    } finally {
      setResendLoading(false);
    }
  };
  const formatOTP = (value) => {
    return value.replace(/\D/g, '').slice(0, 6);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit code to
            <br />
            <span className="font-medium text-indigo-600">{email}</span>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp" className="sr-only">
              OTP
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(formatOTP(e.target.value))}
              maxLength={6}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendTimer > 0 || resendLoading}
                className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' :
                 resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </button>
            </p>
          </div>
        </form>
        <div className="text-center">
          <button
            onClick={() => navigate('/signup')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Sign Up
          </button>
        </div>
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
        actionText="Continue"
        onAction={handleSuccessDialogAction}
      />
    </div>
  );
};
export default OTPVerification;
