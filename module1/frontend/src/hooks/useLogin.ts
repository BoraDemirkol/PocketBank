import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthContext';
import { validateMFACode } from '../utils/validation';
import { ROUTES } from '../utils/constants';

interface LoginFormData {
  email: string;
  password: string;
}

interface MFAState {
  showMFA: boolean;
  code: string;
  challengeId: string;
  factorId: string;
  tempSession: unknown;
}

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [mfaState, setMfaState] = useState<MFAState>({
    showMFA: false,
    code: '',
    challengeId: '',
    factorId: '',
    tempSession: null
  });

  const { signIn, verifyMFA, verifyMFAWithSession } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const handleLogin = async (formData: LoginFormData) => {
    setLoading(true);
    
    try {
      const { error, needsMFA, challengeId, factorId, tempSession } = await signIn(
        formData.email, 
        formData.password
      );
      
      if (needsMFA && factorId) {
        setMfaState({
          showMFA: true,
          code: '',
          challengeId: challengeId || '',
          factorId,
          tempSession
        });
        message.info(t('mfaRequired'));
      } else if (error) {
        message.error(error.message);
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

  const handleMFAVerification = async () => {
    if (!validateMFACode(mfaState.code)) {
      message.error('Please enter a valid 6-digit code');
      return;
    }

    if (!mfaState.factorId) {
      message.error('Missing factor ID');
      return;
    }

    setLoading(true);
    
    try {
      let result;
      if (mfaState.tempSession) {
        result = await verifyMFAWithSession(mfaState.factorId, mfaState.code, mfaState.tempSession);
      } else if (mfaState.challengeId) {
        result = await verifyMFA(mfaState.factorId, mfaState.challengeId, mfaState.code);
      } else {
        message.error('Missing verification data');
        return;
      }
      
      if (result.error) {
        message.error('Invalid MFA code: ' + result.error.message);
      } else {
        message.success(t('loginSuccess'));
        navigate(ROUTES.DASHBOARD);
      }
    } catch {
      message.error(t('mfaVerificationError'));
    } finally {
      setLoading(false);
    }
  };

  const updateMFACode = (code: string) => {
    const numericCode = code.replace(/\D/g, '').slice(0, 6);
    setMfaState(prev => ({ ...prev, code: numericCode }));
  };

  const resetMFAState = () => {
    setMfaState({
      showMFA: false,
      code: '',
      challengeId: '',
      factorId: '',
      tempSession: null
    });
  };

  return {
    loading,
    mfaState,
    handleLogin,
    handleMFAVerification,
    updateMFACode,
    resetMFAState
  };
};