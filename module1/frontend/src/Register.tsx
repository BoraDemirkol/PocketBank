import React, { useState } from 'react';
import { LockOutlined, UserOutlined, ArrowLeftOutlined, MailOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Input, Button, message, Form, Typography } from '../node_modules/antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { signUp } = useAuth();
  const { t } = useTranslation();

  const onFinish = async (values: { name: string; surname: string; email: string; password: string; confirmPassword: string }) => {
    const { name, surname, email, password, confirmPassword } = values;

    if (password !== confirmPassword) {
      message.error(t('passwordsNoMatch'));
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, name, surname);

    if (error) {
      message.error(error.message);
      setLoading(false);
    } else {
      setUserEmail(email);
      setEmailSent(true);
      setLoading(false);
    }
  };

  // Show email verification message if signup was successful
  if (emailSent) {
    return (
      <div style={{
        width: '100%',
        maxWidth: '400px',
        margin: '50px auto',
        backgroundColor: 'var(--card-bg)',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <CheckCircleOutlined 
          style={{ 
            fontSize: '48px', 
            color: 'var(--primary-color)', 
            marginBottom: '20px' 
          }} 
        />
        
        <Title level={3} style={{ color: 'var(--primary-color)', marginBottom: '16px' }}>
          {t('emailVerificationTitle')}
        </Title>
        
        <Text style={{ 
          fontSize: '16px', 
          color: 'var(--text-secondary)', 
          display: 'block',
          marginBottom: '20px',
          lineHeight: '1.5'
        }}>
          {t('registerSuccess')}
        </Text>
        
        <div style={{
          backgroundColor: '#f8faf9',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #e8f5e8'
        }}>
          <MailOutlined style={{ color: 'var(--primary-color)', marginRight: '8px' }} />
          <Text strong style={{ color: 'var(--primary-color)' }}>
            {userEmail}
          </Text>
        </div>
        
        <Text style={{ 
          fontSize: '14px', 
          color: 'var(--text-secondary)',
          display: 'block',
          marginBottom: '24px',
          lineHeight: '1.4'
        }}>
          {t('verificationSuccess')}
        </Text>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link to="/signin" style={{ width: '100%' }}>
            <Button 
              type="primary"
              size="large"
              style={{
                backgroundColor: 'var(--primary-color)',
                borderColor: 'var(--primary-color)',
                fontWeight: 500,
                width: '100%'
              }}
            >
              {t('goToLogin')}
            </Button>
          </Link>
          
          <Link to="/" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
            ← {t('backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  // Show signup form if email hasn't been sent yet
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
        {t('registerTitle')}
      </h2>

      <Form onFinish={onFinish} layout="vertical">
        <Form.Item
          name="name"
          rules={[{ required: true, message: t('firstNameRequired') }]}
        >
          <Input
            placeholder={t('firstName')}
            prefix={<UserOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="surname"
          rules={[{ required: true, message: t('lastNameRequired') }]}
        >
          <Input
            placeholder={t('lastName')}
            prefix={<UserOutlined />}
            size="large"
          />
        </Form.Item>

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

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: t('passwordRequired') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('passwordsNoMatch')));
              }
            })
          ]}
        >
          <Input.Password
            placeholder={t('confirmPassword')}
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
            {t('createAccount')}
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <span>{t('alreadyHaveAccount')} </span>
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

export default Register;
