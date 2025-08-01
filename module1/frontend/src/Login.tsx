import React, { useState } from 'react';
import { LockOutlined, UserOutlined, ArrowLeftOutlined, SecurityScanOutlined } from '@ant-design/icons';
import { Input, Button, message, Form, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [factorId, setFactorId] = useState('');
  const [tempSession, setTempSession] = useState(null);
  const { signIn, verifyMFA, verifyMFAWithSession } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    const { error, needsMFA, challengeId: cId, factorId: fId, tempSession: tSession } = await signIn(values.email, values.password);
    
    if (needsMFA && fId) {
      setChallengeId(cId || '');
      setFactorId(fId);
      setTempSession(tSession);
      setShowMFA(true);
      message.info('Please enter your 6-digit MFA code');
    } else if (error) {
      message.error(error.message);
    } else {
      message.success('Login successful!');
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
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
        {showMFA ? 'Multi-Factor Authentication' : 'Login to PocketBank'}
      </h2>
      
      {showMFA ? (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <SecurityScanOutlined style={{ fontSize: '48px', color: '#4a7c59', marginBottom: '16px' }} />
            <Typography.Text style={{ display: 'block', marginBottom: '16px' }}>
              Enter the 6-digit code from your authenticator app
            </Typography.Text>
          </div>
          
          <Input
            placeholder="Enter 6-digit code"
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
              backgroundColor: '#4a7c59',
              borderColor: '#4a7c59',
              fontWeight: 500,
              marginBottom: '16px'
            }}
          >
            Verify Code
          </Button>
          
          <Button 
            type="text"
            onClick={() => {
              setShowMFA(false);
              setMfaCode('');
              setChallengeId('');
              setFactorId('');
            }}
            style={{ width: '100%', color: '#4a7c59' }}
          >
            Back to Login
          </Button>
        </div>
      ) : (
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
      )}
      
      {!showMFA && (
        <>
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link
              to="/forgot-password"
              style={{ color: '#4a7c59', textDecoration: 'none', fontSize: '14px' }}
            >
              Forgot your password?
            </Link>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span>Don't have an account? </span>
            <Link
              to="/signup"
              style={{ color: '#4a7c59', fontWeight: 'bold', textDecoration: 'none' }}
            >
              Sign Up
            </Link>
          </div>
        </>
      )}
    </div>
  );
};

export default Login;
