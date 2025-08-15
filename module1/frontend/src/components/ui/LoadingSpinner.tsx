import React from 'react';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  centered?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'large', 
  tip,
  centered = true 
}) => {
  const { t } = useTranslation();
  
  if (centered) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size={size} spinning={true}>
          <div style={{ minHeight: '200px' }}>
            {tip && <div style={{ marginTop: '20px', textAlign: 'center' }}>{tip || t('loading')}</div>}
          </div>
        </Spin>
      </div>
    );
  }

  return (
    <Spin size={size} spinning={true}>
      <div style={{ minHeight: '100px' }}>
        {tip && <div style={{ marginTop: '10px', textAlign: 'center' }}>{tip || t('loading')}</div>}
      </div>
    </Spin>
  );
};

export default LoadingSpinner;