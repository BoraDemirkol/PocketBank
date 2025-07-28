import React, { useState } from 'react';
import { LockOutlined, UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Input, Button, message, Form } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { signIn, user, signOut } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    const { error } = await signIn(values.email, values.password);
    
    if (error) {
      message.error(error.message);
    } else {
      message.success('Login successful!');
      navigate('/dashboard');
    }
    setLoading(false);
  };


  return (
    <div style={{ maxWidth: '300px', margin: '50px auto', padding: '20px' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '20px', textDecoration: 'none', color: '#4a7c59' }}>
        <ArrowLeftOutlined style={{ marginRight: '8px' }} />
        Back to Home
      </Link>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Login to PocketBank</h2>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input 
            placeholder="Email" 
            prefix={<UserOutlined />} 
            size="large"
          />
        </Form.Item>
        
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password 
            placeholder="Password" 
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
            Sign In
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <span>Don't have an account? </span>
        <Link
          to="/signup"
          style={{ color: '#4a7c59', fontWeight: 'bold', textDecoration: 'none' }}
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
};

export default Login;
