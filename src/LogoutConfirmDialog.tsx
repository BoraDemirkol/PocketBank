import React from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';

interface LogoutConfirmDialogProps {
  visible: boolean;
  onCancel: () => void;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({ visible, onCancel }) => {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    onCancel();
  };

  return (
    <Modal
      title={t('logout.confirmTitle')}
      open={visible}
      onOk={handleLogout}
      onCancel={onCancel}
      okText={t('logout.confirm')}
      cancelText={t('common.cancel')}
    >
      <p>{t('logout.confirmMessage')}</p>
    </Modal>
  );
};

export default LogoutConfirmDialog; 