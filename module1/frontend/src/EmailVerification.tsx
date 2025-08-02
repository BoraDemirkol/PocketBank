import React from 'react';
import { Button, Typography } from '../node_modules/antd';
import { Link } from 'react-router-dom';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const EmailVerification: React.FC = () => {
  const { t } = useTranslation();
  
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
          color: 'var(--primary-color)', 
          marginBottom: '24px' 
        }} 
      />
      
      <Title level={2} style={{ color: 'var(--primary-color)', marginBottom: '16px' }}>
        {t('verificationSuccess')}
      </Title>
      
      <Text style={{ 
        fontSize: '16px', 
        color: 'var(--text-secondary)', 
        marginBottom: '32px',
        maxWidth: '400px',
        lineHeight: '1.6'
      }}>
        {t('verificationSuccess')}
      </Text>
      
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/signin">
          <Button 
            type="primary"
            size="large"
            style={{
              backgroundColor: 'var(--primary-color)',
              borderColor: 'var(--primary-color)',
              fontWeight: 500,
              minWidth: '120px'
            }}
          >
            {t('signIn')}
          </Button>
        </Link>
      </div>
      
      <div style={{ marginTop: '32px' }}>
        <Link to="/" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
          ← {t('backToHome')}
        </Link>
      </div>
    </div>
  );
};

export default EmailVerification;