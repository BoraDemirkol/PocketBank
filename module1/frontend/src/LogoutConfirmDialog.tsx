import React from 'react';
import { Modal, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface LogoutConfirmDialogProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  visible,
  onConfirm,
  onCancel,
  loading = false
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          color: 'var(--text-color)'
        }}>
          <ExclamationCircleOutlined style={{ 
            color: 'var(--warning-color)', 
            fontSize: '20px' 
          }} />
          {t('confirmLogout')}
        </div>
      }
      open={visible}
      onCancel={onCancel}
      centered
      width={400}
      footer={null}
      style={{
        borderRadius: '12px'
      }}
      styles={{
        content: {
          backgroundColor: 'var(--card-bg)',
          borderRadius: '12px'
        },
        header: {
          backgroundColor: 'var(--card-bg)',
          borderBottom: '1px solid var(--border-color, #f0f0f0)',
          borderRadius: '12px 12px 0 0'
        }
      }}
    >
      <div style={{ 
        padding: '20px 0',
        color: 'var(--text-color)'
      }}>
        <p style={{ 
          fontSize: '16px',
          lineHeight: '1.5',
          margin: 0,
          color: 'var(--text-secondary)'
        }}>
          {t('logoutConfirmMessage')}
        </p>
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '12px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-color, #f0f0f0)'
      }}>
        <Button
          onClick={onCancel}
          size="large"
          style={{
            backgroundColor: 'var(--button-secondary-bg)',
            borderColor: 'var(--button-secondary-border)',
            color: 'var(--primary-color)',
            fontWeight: 500
          }}
        >
          {t('cancel')}
        </Button>
        <Button
          type="primary"
          onClick={onConfirm}
          loading={loading}
          size="large"
          danger
          style={{
            fontWeight: 500
          }}
        >
          {t('logout')}
        </Button>
      </div>
    </Modal>
  );
};

export default LogoutConfirmDialog;