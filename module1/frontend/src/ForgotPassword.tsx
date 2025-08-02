import React, { useState } from 'react';
import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons';
import { Input, Button, Form, App } from '../node_modules/antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';

const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    const { error } = await resetPassword(values.email);
    
    if (error) {
      message.error(error.message || t('resetEmailFailed'));
    } else {
      message.success(t('resetEmailSent'));
      setEmailSent(true);
    }
    setLoading(false);
  };

  if (emailSent) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
        <Link to="/signin" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '20px', textDecoration: 'none', color: 'var(--primary-color)' }}>
          <ArrowLeftOutlined style={{ marginRight: '8px' }} />
          {t('backToSignIn')}
        </Link>
        <div style={{ marginBottom: '30px' }}>
          <MailOutlined style={{ fontSize: '48px', color: 'var(--primary-color)', marginBottom: '16px' }} />
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '16px' }}>{t('checkYourEmail')}</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {t('resetEmailDescription')}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '20px' }}>
            {t('didntReceiveEmail')}
          </p>
        </div>
        <Button 
          type="default" 
          onClick={() => setEmailSent(false)}
          style={{ 
            borderColor: 'var(--primary-color)',
            color: 'var(--primary-color)'
          }}
        >
          {t('sendAnotherEmail')}
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <Link to="/signin" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '20px', textDecoration: 'none', color: 'var(--primary-color)' }}>
        <ArrowLeftOutlined style={{ marginRight: '8px' }} />
        {t('backToSignIn')}
      </Link>
      
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>{t('forgotPasswordTitle')}</h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '30px' }}>
        {t('forgotPasswordSubtitle')}
      </p>
      
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item
          name="email"
          rules={[
            { required: true, message: t('emailRequired') },
            { type: 'email', message: t('emailInvalid') }
          ]}
        >
          <Input 
            placeholder={t('enterEmailAddress')} 
            prefix={<MailOutlined />} 
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
            {t('sendResetEmail')}
          </Button>
        </Form.Item>
      </Form>
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <span style={{ color: 'var(--text-secondary)' }}>{t('rememberPassword')} </span>
        <Link
          to="/signin"
          style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}
        >
          {t('signIn')}
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;