import React, { useState } from 'react';
import { LockOutlined, UserOutlined, ArrowLeftOutlined, SecurityScanOutlined, MailOutlined } from '@ant-design/icons';
import { Input, Button, message, Form, Typography } from '../node_modules/antd';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [factorId, setFactorId] = useState('');
  const [tempSession, setTempSession] = useState(null);
  const { signIn, verifyMFA, verifyMFAWithSession } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    const { error, needsMFA, challengeId: cId, factorId: fId, tempSession: tSession } = await signIn(values.email, values.password);
    
    if (needsMFA && fId) {
      setChallengeId(cId || '');
      setFactorId(fId);
      setTempSession(tSession);
      setShowMFA(true);
      message.info(t('mfaRequired'));
    } else if (error) {
      message.error(error.message);
    } else {
      message.success(t('loginSuccess'));
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleMFAVerification = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      message.error('Please enter a valid 6-digit code');
      return;
    }

    if (!factorId) {
      message.error('Missing factor ID');
      return;
    }

    setLoading(true);
    
    let result;
    if (tempSession) {
      result = await verifyMFAWithSession(factorId, mfaCode, tempSession);
    } else if (challengeId) {
      result = await verifyMFA(factorId, challengeId, mfaCode);
    } else {
      message.error('Missing verification data');
      setLoading(false);
      return;
    }
    
    if (result.error) {
      message.error('Invalid MFA code: ' + result.error.message);
    } else {
      message.success(t('loginSuccess'));
      navigate('/dashboard');
    }
    setLoading(false);
  };


  return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
      margin: '50px auto',
      backgroundColor: 'var(--card-bg)',
      padding: '30px',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '20px', textDecoration: 'none', color: 'var(--primary-color)' }}>
        <ArrowLeftOutlined style={{ marginRight: '8px' }} />
        {t('backToHome')}
      </Link>
      <h2 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--primary-color)' }}>
        {showMFA ? t('mfaTitle') : t('loginTitle')}
      </h2>
      
      {showMFA ? (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <SecurityScanOutlined style={{ fontSize: '48px', color: 'var(--primary-color)', marginBottom: '16px' }} />
            <Text style={{ display: 'block', marginBottom: '16px' }}>
              {t('mfaDescription')}
            </Text>
          </div>
          
          <Input
            placeholder={t('mfaPlaceholder')}
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
            onClick={() => {
              setShowMFA(false);
              setMfaCode('');
              setChallengeId('');
              setFactorId('');
            }}
            style={{ width: '100%', color: 'var(--primary-color)' }}
          >
            {t('backToLogin')}
          </Button>
        </div>
      ) : (
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('emailRequired') },
              { type: 'email', message: t('emailInvalid') }
            ]}
          >
            <Input
              placeholder={t('email')}
              prefix={<MailOutlined />}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('passwordRequired') }]}
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
      
      {!showMFA && (
        <>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link
              to="/forgot-password"
              style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '14px' }}
            >
              {t('forgotPassword')}
            </Link>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span>{t('dontHaveAccount')} </span>
            <Link
              to="/signup"
              style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}
            >
              {t('signUp')}
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Login;
