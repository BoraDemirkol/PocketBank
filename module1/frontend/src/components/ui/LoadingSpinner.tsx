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
  
  const content = (
    <Spin size={size} tip={tip || t('loading')} />
  );

  if (centered) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;