import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';
import { ROUTES } from '../utils/constants';

interface LoginFormData {
  email: string;
  password: string;
}

export const useLogin = () => {
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogin = async (formData: LoginFormData) => {
    setLoading(true);
    
    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('Email confirmation required')) {
          message.warning('Please check your email and confirm your account before signing in.');
          // Redirect to email verification page or show message
        } else {
          message.error(error.message);
        }
      } else {
        message.success(t('loginSuccess'));
        navigate(ROUTES.DASHBOARD);
      }
    } catch {
      message.error(t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleLogin
  };
};