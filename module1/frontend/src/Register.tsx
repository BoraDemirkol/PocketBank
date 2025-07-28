 import React, { useState } from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Input, Button, message, Form } from '../node_modules/antd';
import { useAuth } from './AuthContext';

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth(); // AuthContext'te tanımlı olmalı

  const onFinish = async (values: { email: string; password: string; confirmPassword: string }) => {
    const { email, password, confirmPassword } = values;

    if (password !== confirmPassword) {
      message.error('Passwords do not match!');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password);

    if (error) {
      message.error(error.message);
    } else {
      message.success('Account created successfully!');
    }

    setLoading(false);
  };

 return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
      margin: '50px auto',
      backgroundColor: '#ffffff',
      padding: '30px',
      borderRadius: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#4a7c59' }}>
        Create your PocketBank Account
      </h2>

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

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match!'));
              }
            })
          ]}
        >
          <Input.Password
            placeholder="Confirm Password"
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
            Sign Up
          </Button>
        </Form.Item>
      </Form>
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
  <span>Already have an account? </span>
  <a
    href="/login"
    style={{ color: '#4a7c59', fontWeight: 'bold', textDecoration: 'none' }}
  >
    Sign In
  </a>
</div>
    </div>
);
};

export default Register;
