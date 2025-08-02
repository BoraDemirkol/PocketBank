import React, { useState } from 'react';
import { ArrowLeftOutlined, MailOutlined } from '@ant-design/icons';
import { Input, Button, Form, App } from '../node_modules/antd';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const { message } = App.useApp();

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    const { error } = await resetPassword(values.email);
    
    if (error) {
      message.error(error.message || 'Failed to send reset email');
    } else {
      message.success('Password reset email sent! Check your inbox.');
      setEmailSent(true);
    }
    setLoading(false);
  };

  if (emailSent) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
        <Link to="/signin" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '20px', textDecoration: 'none', color: '#4a7c59' }}>
          <ArrowLeftOutlined style={{ marginRight: '8px' }} />
          Back to Sign In
        </Link>
        <div style={{ marginBottom: '30px' }}>
          <MailOutlined style={{ fontSize: '48px', color: '#4a7c59', marginBottom: '16px' }} />
          <h2 style={{ color: '#4a7c59', marginBottom: '16px' }}>Check Your Email</h2>
          <p style={{ color: '#666', lineHeight: '1.6' }}>
            We've sent a password reset link to your email address. 
            Click the link in the email to reset your password.
          </p>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '20px' }}>
            Didn't receive the email? Check your spam folder or try again.
          </p>
        </div>
        <Button 
          type="default" 
          onClick={() => setEmailSent(false)}
          style={{ 
            borderColor: '#4a7c59',
            color: '#4a7c59'
          }}
        >
          Send Another Email
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <Link to="/signin" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '20px', textDecoration: 'none', color: '#4a7c59' }}>
        <ArrowLeftOutlined style={{ marginRight: '8px' }} />
        Back to Sign In
      </Link>
      
      <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Forgot Password</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' }
          ]}
        >
          <Input 
            placeholder="Enter your email address" 
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
              backgroundColor: '#4a7c59',
              borderColor: '#4a7c59',
              fontWeight: 500,
              borderRadius: '6px'
            }}
          >
            Send Reset Email
          </Button>
        </Form.Item>
      </Form>
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <span style={{ color: '#666' }}>Remember your password? </span>
        <Link
          to="/signin"
          style={{ color: '#4a7c59', fontWeight: 'bold', textDecoration: 'none' }}
        >
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;