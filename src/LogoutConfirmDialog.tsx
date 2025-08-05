import React from 'react';
import { Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';

interface LogoutConfirmDialogProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({ visible, onConfirm, onCancel, loading = false }) => {
  const { t } = useTranslation();

  const handleLogout = async () => {
    await onConfirm();
  };

  return (
    <Modal
      title={t('logout.confirmTitle')}
      open={visible}
      onOk={handleLogout}
      onCancel={onCancel}
      okText={t('logout.confirm')}
      cancelText={t('common.cancel')}
      confirmLoading={loading}
    >
      <p>{t('logout.confirmMessage')}</p>
    </Modal>
  );
};

export default LogoutConfirmDialog; 