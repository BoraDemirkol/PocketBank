import { useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';
import { validatePasswordMatch } from '../utils/validation';

interface RegisterFormData {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterState {
  loading: boolean;
  emailSent: boolean;
  userEmail: string;
}

export const useRegister = () => {
  const [state, setState] = useState<RegisterState>({
    loading: false,
    emailSent: false,
    userEmail: ''
  });

  const { signUp } = useAuth();
  const { t } = useTranslation();

  const handleRegister = async (formData: RegisterFormData) => {
    const { name, surname, email, password, confirmPassword } = formData;

    if (!validatePasswordMatch(password, confirmPassword)) {
      message.error(t('passwordsNoMatch'));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const { error, data } = await signUp(email, password, name, surname);

      if (error) {
        message.error(error.message);
      } else {
        // Check if email confirmation is required
        if (data?.user && !data.user.email_confirmed_at) {
          setState(prev => ({
            ...prev,
            userEmail: email,
            emailSent: true
          }));
          message.success(t('verificationEmailSent'));
        } else {
          // User is already confirmed (shouldn't happen with proper Supabase settings)
          message.success(t('registrationSuccess'));
        }
      }
    } catch {
      message.error(t('registrationError'));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const resetState = () => {
    setState({
      loading: false,
      emailSent: false,
      userEmail: ''
    });
  };

  return {
    ...state,
    handleRegister,
    resetState
  };
};