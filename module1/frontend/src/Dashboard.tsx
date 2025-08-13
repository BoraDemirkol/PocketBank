import React from 'react';
import { UserOutlined, TransactionOutlined, PieChartOutlined, BarChartOutlined, SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { useDashboard } from './hooks';
import { LoadingSpinner } from './components/ui';
import { QuickAccessCard, ProfileCard, BalanceCard, DashboardHeader } from './components/dashboard';
import { UI_CONSTANTS } from './utils/constants';
import LogoutConfirmDialog from './LogoutConfirmDialog';
import { Link } from 'react-router-dom'; // <-- DEĞİŞİKLİK 1: Link aracını import ettik.

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      // <-- DEĞİŞİKLİK 2: onClick'i silip yerine 'to' özelliğini ekledik.
      title: t('analyticsReporting') || 'Analytics & Reporting',
      icon: <BarChartOutlined />,
      to: '/analytics' 
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