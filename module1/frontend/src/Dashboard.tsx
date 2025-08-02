import React, { useState, useEffect } from 'react';
import { Card, Button, message, Spin, Avatar } from '../node_modules/antd';
import { EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { apiService } from './api';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  surname: string;
  profilePictureUrl?: string;
  message: string;
}

interface UserBalance {
  userId: string;
  balance: number;
  currency: string;
}

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile and balance from backend
        const [profileData, balanceData] = await Promise.all([
          apiService.get('/account/profile'),
          apiService.get('/account/balance')
        ]);
        
        setProfile(profileData);
        setBalance(balanceData);
      } catch {
        message.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip={t('loading')} />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{t('dashboard')}</h1>
        <Button onClick={handleSignOut} type="primary" danger>
          {t('logout')}
        </Button>
      </div>
      
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <Card 
          title={t('editProfile')} 
          variant="outlined"
          extra={
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => navigate('/profile/edit')}
              style={{ color: 'var(--primary-color)' }}
            >
              {t('edit')}
            </Button>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <Avatar
              size={64}
              src={profile?.profilePictureUrl}
              style={{ backgroundColor: 'var(--primary-color)', marginRight: '16px' }}
            >
              {profile?.name?.[0]?.toUpperCase()}{profile?.surname?.[0]?.toUpperCase()}
            </Avatar>
            <div>
              <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>
                {profile?.name} {profile?.surname}
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{user?.email}</p>
            </div>
          </div>
          <p><strong>User ID:</strong> {profile?.userId}</p>
          <p><strong>Status:</strong> {profile?.message}</p>
        </Card>
        
        <Card title={t('accountBalance')} variant="outlined">
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
            ${balance?.balance?.toFixed(2)} {balance?.currency}
          </div>
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
            {t('accountBalance')}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;