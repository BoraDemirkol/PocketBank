import React from 'react';
import { LockOutlined, UserOutlined, MailOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Input, Form, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import FormCard from './components/ui/FormCard';
import { useRegister } from './hooks';
import { createFormValidationRules } from './utils/validation';
import { ROUTES } from './utils/constants';

const { Text } = Typography;

const Register: React.FC = () => {
  const { t } = useTranslation();
  const { loading, emailSent, userEmail, handleRegister } = useRegister();
  const validationRules = createFormValidationRules(t);


  // Show email verification message if signup was successful
  if (emailSent) {
    return (
      <FormCard 
        title={t('emailVerificationTitle')} 
        showBackButton={false}
        className="text-center"
      >
        <div style={{ textAlign: 'center' }}>
          <CheckCircleOutlined 
            style={{ 
              fontSize: '48px', 
              color: 'var(--primary-color)', 
              marginBottom: '20px' 
            }} 
          />
        
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
            <Link to={ROUTES.SIGNIN} style={{ width: '100%' }}>
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
            
            <Link to={ROUTES.HOME} style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
              ← {t('backToHome')}
            </Link>
          </div>
        </div>
      </FormCard>
    );
  }

  // Show signup form if email hasn't been sent yet
  return (
    <FormCard title={t('registerTitle')}>
      <Form onFinish={handleRegister} layout="vertical">
        <Form.Item
          name="name"
          rules={validationRules.name}
        >
          <Input
            placeholder={t('firstName')}
            prefix={<UserOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="surname"
          rules={validationRules.surname}
        >
          <Input
            placeholder={t('lastName')}
            prefix={<UserOutlined />}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={validationRules.email}
        >
          <Input
            placeholder={t('email')}
            prefix={<MailOutlined />}
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
          to={ROUTES.SIGNIN}
          style={{ color: 'var(--primary-color)', fontWeight: 'bold', textDecoration: 'none' }}
        >
          {t('signIn')}
        </Link>
      </div>
    </FormCard>
);
};

export default Register;
