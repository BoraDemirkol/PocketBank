import React from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Input, Form } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';
import FormCard from './components/ui/FormCard';
import { useLogin } from './hooks';
import { createFormValidationRules } from './utils/validation';
import { ROUTES } from './utils/constants';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { loading, handleLogin } = useLogin();
  
  const validationRules = createFormValidationRules(t);

  return (
    <FormCard title={t('loginTitle')}>
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
    </FormCard>
  );
};

export default Login;
