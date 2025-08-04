import React from 'react';
import { LockOutlined, UserOutlined, SecurityScanOutlined } from '@ant-design/icons';
import { Input, Form, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import FormCard from './components/ui/FormCard';
import { useLogin } from './hooks';
import { createFormValidationRules } from './utils/validation';
import { ROUTES } from './utils/constants';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { 
    loading, 
    mfaState, 
    handleLogin, 
    handleMFAVerification, 
    updateMFACode, 
    resetMFAState 
  } = useLogin();
  
  const validationRules = createFormValidationRules(t);



  return (
    <FormCard title={mfaState.showMFA ? t('mfaTitle') : t('loginTitle')}>
      
      {mfaState.showMFA ? (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <SecurityScanOutlined style={{ fontSize: '48px', color: 'var(--primary-color)', marginBottom: '16px' }} />
            <Typography.Text style={{ display: 'block', marginBottom: '16px' }}>
              {t('mfaDescription')}
            </Typography.Text>
          </div>
          
          <Input
            placeholder={t('mfaPlaceholder')}
            value={mfaState.code}
            onChange={(e) => updateMFACode(e.target.value)}
            maxLength={6}
            size="large"
            style={{ 
              textAlign: 'center', 
              fontSize: '18px', 
              letterSpacing: '4px',
              marginBottom: '20px'
            }}
            onPressEnter={handleMFAVerification}
          />
          
          <Button
            type="primary"
            onClick={handleMFAVerification}
            loading={loading}
            size="large"
            style={{ 
              width: '100%',
              backgroundColor: 'var(--primary-color)',
              borderColor: 'var(--primary-color)',
              fontWeight: 500,
              marginBottom: '16px'
            }}
          >
            {t('verifyCode')}
          </Button>
          
          <Button
            type="text"
            onClick={resetMFAState}
            style={{ width: '100%', color: 'var(--primary-color)' }}
          >
            {t('backToLogin')}
          </Button>
        </div>
      ) : (
        <Form onFinish={handleLogin} layout="vertical">
        <Form.Item
          name="email"
          rules={validationRules.email}
        >
          <Input 
            placeholder={t('email')} 
            prefix={<UserOutlined />} 
            size="large"
          />
        </Form.Item>
        
        <Form.Item
          name="password"
          rules={validationRules.password}
        >
          <Input.Password 
            placeholder={t('password')} 
            prefix={<LockOutlined />} 
            size="large"
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
              fontWeight: 500
            }}
          >
            {t('signIn')}
          </Button>
        </Form.Item>
      </Form>
      )}
      
      {!mfaState.showMFA && (
        <>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '14px' }}
            >
              {t('forgotPassword')}
            </Link>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span>{t('dontHaveAccount')} </span>
            <Link
              to={ROUTES.SIGNUP}
              style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}
            >
              {t('signUp')}
            </Link>
          </div>
        </>
      )}
    </FormCard>
  );
};

export default Login;
