import React, { useState, useEffect } from 'react';
import { Card, Button, message, Spin, Avatar, List } from '../node_modules/antd';
import { EditOutlined, UserOutlined, TransactionOutlined, PieChartOutlined, BarChartOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { apiService } from './api';
import { useNavigate } from 'react-router-dom';
import LogoutConfirmDialog from './LogoutConfirmDialog';

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
  const { theme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

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
    setLogoutLoading(true);
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      message.error('Failed to logout');
    } finally {
      setLogoutLoading(false);
      setShowLogoutDialog(false);
    }
  };

  const showLogoutConfirmation = () => {
    setShowLogoutDialog(true);
  };

  const hideLogoutConfirmation = () => {
    setShowLogoutDialog(false);
  };

  const navigationItems = [
    {
      title: t('accountManagement') || 'Account Management',
      icon: <UserOutlined />,
      onClick: () => console.log('Navigate to Account Management')
    },
    {
      title: t('transactionManagement') || 'Transaction Management',
      icon: <TransactionOutlined />,
      onClick: () => console.log('Navigate to Transaction Management')
    },
    {
      title: t('budgetPlanning') || 'Budget Planning',
      icon: <PieChartOutlined />,
      onClick: () => console.log('Navigate to Budget Planning')
    },
    {
      title: t('analyticsReporting') || 'Analytics & Reporting',
      icon: <BarChartOutlined />,
      onClick: () => console.log('Navigate to Analytics and Reporting')
    },
    {
      title: t('profile') || 'Profile Settings',
      icon: <SettingOutlined />,
      onClick: () => navigate('/profile/edit')
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip={t('loading')} />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>{t('dashboard')}</h1>
        <Button onClick={showLogoutConfirmation} type="primary" danger>
          {t('logout')}
        </Button>
      </div>
      
      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ width: '320px', flexShrink: 0 }}>
          <Card 
            title={t('quick Access') || 'Quick Access'} 
            variant="outlined"
            style={{
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              border: '1px solid var(--border-color, #e8f5e8)',
              backgroundColor: 'var(--card-bg, #ffffff)'
            }}
            headStyle={{
              backgroundColor: 'var(--card-header-bg, #4a7c59)',
              borderBottom: '1px solid var(--border-color, #e8f5e8)',
              borderRadius: '12px 12px 0 0',
              padding: '16px 20px',
              color: '#ffffff'
            }}
            bodyStyle={{ padding: '8px' }}
          >
            <List
              dataSource={navigationItems}
              split={false}
              renderItem={(item) => (
                <List.Item style={{ padding: '4px 0', border: 'none' }}>
                  <Button
                    type="text"
                    icon={item.icon}
                    onClick={item.onClick}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      height: 'auto',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: theme === 'dark' ? '#ffffff' : '#4a7c59'
                    }}
                    onMouseEnter={(e) => {
                      const isDarkMode = theme === 'dark';
                      e.currentTarget.style.backgroundColor = isDarkMode ? '#404040' : '#f0f8f0';
                      e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#4a7c59';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = theme === 'dark' ? '#ffffff' : '#4a7c59';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <span style={{ 
                      marginLeft: '12px', 
                      letterSpacing: '0.3px',
                      lineHeight: '1.4'
                    }}>
                      {item.title}
                    </span>
                  </Button>
                </List.Item>
              )}
            />
          </Card>
        </div>
        
        <div style={{ flex: 1 }}>
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
      </div>

      <LogoutConfirmDialog
        visible={showLogoutDialog}
        onConfirm={handleSignOut}
        onCancel={hideLogoutConfirmation}
        loading={logoutLoading}
      />
    </div>
  );
};

export default Dashboard;