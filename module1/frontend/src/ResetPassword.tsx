import React, { useState, useEffect, useRef } from 'react';
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Input, Button, Form, App } from 'antd';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
        
        let errorMessage = t('invalidResetLink');
        if (errorCode === 'otp_expired') {
          errorMessage = t('invalidResetLink');
        } else if (error === 'access_denied') {
          errorMessage = t('invalidResetLink');
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
            message.error(t('invalidResetLink'));
            navigate('/forgot-password');
          } else {
            setIsValidSession(true);
          }
        } catch {
          message.error(t('invalidResetLink'));
          navigate('/forgot-password');
        }
      } else if (session && user) {
        // User already has a valid session - allow them to change password
        setIsValidSession(true);
      } else {
        // No valid session or URL parameters
        if (!errorShownRef.current) {
          errorShownRef.current = true;
          message.error(t('invalidResetLink'));
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
      message.error(t('passwordsDoNotMatch'));
      return;
    }

    if (values.password.length < 6) {
      message.error(t('passwordTooShort'));
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(values.password);
    
    if (error) {
      message.error(error.message || t('passwordUpdateFailed'));
    } else {
      message.success(t('passwordUpdated'));
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
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '16px' }}>{t('passwordUpdated')}</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {t('passwordUpdateSuccess')}
          </p>
        </div>
        <Button 
          type="primary" 
          onClick={() => navigate('/dashboard')}
          style={{ 
            backgroundColor: 'var(--primary-color)',
            borderColor: 'var(--primary-color)'
          }}
        >
          {t('goToDashboard')}
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
        <div>{t('verifyingResetLink')}</div>
      </div>
    );
  }

  if (!isValidSession) {
    return null; // Will redirect to forgot password page
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>{t('resetPasswordTitle')}</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '30px' }}>
        {t('resetPasswordSubtitle')}
      </p>
      
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item
          name="password"
          rules={[
            { required: true, message: t('pleaseInputNewPassword') },
            { min: 6, message: t('passwordMinLength') }
          ]}
        >
          <Input.Password 
            placeholder={t('newPassword')} 
            prefix={<LockOutlined />} 
            size="large"
            style={{ borderRadius: '6px' }}
          />
        </Form.Item>
        
        <Form.Item
          name="confirmPassword"
          rules={[
            { required: true, message: t('pleaseConfirmNewPassword') },
            { min: 6, message: t('passwordMinLength') }
          ]}
        >
          <Input.Password 
            placeholder={t('confirmNewPassword')} 
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
              backgroundColor: 'var(--primary-color)',
              borderColor: 'var(--primary-color)',
              fontWeight: 500,
              borderRadius: '6px'
            }}
          >
            {t('updatePassword')}
          </Button>
        </Form.Item>
      </Form>
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link
          to="/signin"
          style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}
        >
          {t('backToSignIn')}
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;