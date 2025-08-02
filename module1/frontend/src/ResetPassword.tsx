import React, { useState, useEffect, useRef } from 'react';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Input, Button, Form, App } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';

const ResetPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const errorShownRef = useRef(false);
  const { updatePassword, user, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();

  useEffect(() => {
    const checkResetSession = async () => {
      // Prevent multiple error messages
      if (errorShownRef.current) return;
      
      // Check for error in URL hash (from Supabase)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const error = hashParams.get('error');
      const errorCode = hashParams.get('error_code');
      // const errorDescription = hashParams.get('error_description');
      
      if (error) {
        errorShownRef.current = true;
        
        let errorMessage = 'Invalid or expired reset link. Please request a new one.';
        if (errorCode === 'otp_expired') {
          errorMessage = 'Reset link has expired. Please request a new one.';
        } else if (error === 'access_denied') {
          errorMessage = 'Reset link is invalid or has been used. Please request a new one.';
        }
        
        message.error(errorMessage);
        setTimeout(() => {
          navigate('/forgot-password');
        }, 1500);
        setCheckingSession(false);
        return;
      }
      
      // Check for valid reset parameters
      const accessToken = searchParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token');
      const type = searchParams.get('type') || hashParams.get('type');
      
      if (accessToken && refreshToken && type === 'recovery') {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            message.error('Invalid or expired reset link. Please request a new one.');
            navigate('/forgot-password');
          } else {
            setIsValidSession(true);
          }
        } catch {
          message.error('Invalid or expired reset link. Please request a new one.');
          navigate('/forgot-password');
        }
      } else if (session && user) {
        // User already has a valid session - allow them to change password
        setIsValidSession(true);
      } else {
        // No valid session or URL parameters
        if (!errorShownRef.current) {
          errorShownRef.current = true;
          message.error('Invalid or expired reset link. Please request a new one.');
          setTimeout(() => {
            navigate('/forgot-password');
          }, 1500);
        }
      }
      
      setCheckingSession(false);
    };

    checkResetSession();
  }, [session, user, navigate, searchParams, message]);

  const onFinish = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match!');
      return;
    }

    if (values.password.length < 6) {
      message.error('Password must be at least 6 characters long!');
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(values.password);
    
    if (error) {
      message.error(error.message || 'Failed to update password');
    } else {
      message.success('Password updated successfully!');
      setPasswordUpdated(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
    setLoading(false);
  };

  if (passwordUpdated) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
        <div style={{ marginBottom: '30px' }}>
          <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
          <h2 style={{ color: '#4a7c59', marginBottom: '16px' }}>Password Updated!</h2>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            Your password has been successfully updated. You will be redirected to your dashboard shortly.
          </p>
        </div>
        <Button 
          type="primary" 
          onClick={() => navigate('/dashboard')}
          style={{ 
            backgroundColor: '#4a7c59',
            borderColor: '#4a7c59'
          }}
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (checkingSession) {
    return (
      <div style={{ 
        maxWidth: '400px', 
        margin: '50px auto', 
        padding: '20px', 
        textAlign: 'center' 
      }}>
        <div>Verifying reset link...</div>
      </div>
    );
  }

  if (!isValidSession) {
    return null; // Will redirect to forgot password page
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Reset Your Password</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        Enter your new password below.
      </p>
      
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item
          name="password"
          rules={[
            { required: true, message: 'Please input your new password!' },
            { min: 6, message: 'Password must be at least 6 characters long!' }
          ]}
        >
          <Input.Password 
            placeholder="New password" 
            prefix={<LockOutlined />} 
            size="large"
            style={{ borderRadius: '6px' }}
          />
        </Form.Item>
        
        <Form.Item
          name="confirmPassword"
          rules={[
            { required: true, message: 'Please confirm your new password!' },
            { min: 6, message: 'Password must be at least 6 characters long!' }
          ]}
        >
          <Input.Password 
            placeholder="Confirm new password" 
            prefix={<LockOutlined />} 
            size="large"
            style={{ borderRadius: '6px' }}
          />
        </Form.Item>
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            size="large"
            style={{ 
              width: '100%',
              backgroundColor: '#4a7c59',
              borderColor: '#4a7c59',
              fontWeight: 500,
              borderRadius: '6px'
            }}
          >
            Update Password
          </Button>
        </Form.Item>
      </Form>
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link
          to="/signin"
          style={{ color: '#4a7c59', fontWeight: 'bold', textDecoration: 'none' }}
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;