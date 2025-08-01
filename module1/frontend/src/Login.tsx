import React, { useState } from 'react';
import { LockOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Input, Button, message, Form } from '../node_modules/antd';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { signIn, user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    const { error } = await signIn(values.email, values.password);
    
    if (error) {
      message.error(error.message);
    } else {
      message.success(t('loginSuccess'));
      navigate('/dashboard');
    }
    setLoading(false);
  };


  return (
    <div style={{ maxWidth: '300px', margin: '50px auto', padding: '20px' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '20px', textDecoration: 'none', color: '#4a7c59' }}>
        <ArrowLeftOutlined style={{ marginRight: '8px' }} />
        {t('backToHome')}
      </Link>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>{t('loginTitle')}</h2>
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
            prefix={<UserOutlined />} 
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
              backgroundColor: '#4a7c59',
              borderColor: '#4a7c59',
              fontWeight: 500
            }}
          >
            {t('signIn')}
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <span>{t('dontHaveAccount')} </span>
        <Link
          to="/signup"
          style={{ color: '#4a7c59', fontWeight: 'bold', textDecoration: 'none' }}
        >
          {t('signUp')}
        </Link>
      </div>
    </div>
  );
};

export default Login;
