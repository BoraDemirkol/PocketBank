import React from 'react';
import { Button, Typography } from '../node_modules/antd';
import { Link } from 'react-router-dom';
import { CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const EmailVerification: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '40px 20px'
    }}>
      <CheckCircleOutlined 
        style={{ 
          fontSize: '64px', 
          color: '#4a7c59', 
          marginBottom: '24px' 
        }} 
      />
      
      <Title level={2} style={{ color: '#4a7c59', marginBottom: '16px' }}>
        Email Verified Successfully!
      </Title>
      
      <Text style={{ 
        fontSize: '16px', 
        color: '#666', 
        marginBottom: '32px',
        maxWidth: '400px',
        lineHeight: '1.6'
      }}>
        Your email has been successfully verified. You can now access all features of your PocketBank account.
      </Text>
      
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/signin">
          <Button 
            type="primary"
            size="large"
            style={{
              backgroundColor: '#4a7c59',
              borderColor: '#4a7c59',
              fontWeight: 500,
              minWidth: '120px'
            }}
          >
            Sign In
          </Button>
        </Link>
      </div>
      
      <div style={{ marginTop: '32px' }}>
        <Link to="/" style={{ color: '#4a7c59', textDecoration: 'none' }}>
          ← Back to Home
        </Link>
      </div>
    </div>
  );
};

export default EmailVerification;