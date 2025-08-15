import React from 'react';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '../ui';

interface DashboardHeaderProps {
  onLogout: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onLogout }) => {
  const { t } = useTranslation();

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '20px' 
    }}>
      <h1>{t('dashboard')}</h1>
      <PrimaryButton onClick={onLogout} variant="danger">
        {t('logout')}
      </PrimaryButton>
    </div>
  );
};

export default DashboardHeader;