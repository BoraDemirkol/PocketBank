import React from 'react';
import { UserOutlined, TransactionOutlined, PieChartOutlined, BarChartOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useDashboard } from './hooks';
import { LoadingSpinner } from './components/ui';
import { QuickAccessCard, ProfileCard, BalanceCard, DashboardHeader } from './components/dashboard';
import { UI_CONSTANTS } from './utils/constants';
import LogoutConfirmDialog from './LogoutConfirmDialog';
<<<<<<< HEAD
=======
import { useNavigate } from 'react-router-dom';
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
<<<<<<< HEAD
=======
  const navigate = useNavigate();
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
  const {
    profile,
    balance,
    loading,
    logoutLoading,
    showLogoutDialog,
    handleSignOut,
    showLogoutConfirmation,
    hideLogoutConfirmation,
    navigateToProfile
  } = useDashboard();

<<<<<<< HEAD

=======
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
  const navigationItems = [
    {
      title: t('accountManagement') || 'Account Management',
      icon: <UserOutlined />,
      onClick: () => console.log('Navigate to Account Management')
    },
    {
      title: t('transactionManagement') || 'Transaction Management',
      icon: <TransactionOutlined />,
<<<<<<< HEAD
      onClick: () => console.log('Navigate to Transaction Management')
=======
      onClick: () => navigate('/transactions')
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
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
      onClick: navigateToProfile
    }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '20px', maxWidth: `${UI_CONSTANTS.DASHBOARD_MAX_WIDTH}px`, margin: '0 auto' }}>
      <DashboardHeader onLogout={showLogoutConfirmation} />
      
      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ width: '320px', flexShrink: 0 }}>
          <QuickAccessCard items={navigationItems} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <ProfileCard
              profile={profile}
              userEmail={user?.email}
              onEditProfile={navigateToProfile}
            />
            
            <BalanceCard balance={balance} />
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