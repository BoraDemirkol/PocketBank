import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface FormCardProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
  maxWidth?: number;
  className?: string;
}

const FormCard: React.FC<FormCardProps> = ({
  children,
  title,
  showBackButton = true,
  maxWidth = 400,
  className = ''
}) => {
  const { t } = useTranslation();

  return (
    <div 
      className={`form-card ${className}`}
      style={{
        width: '100%',
        maxWidth: `${maxWidth}px`,
        margin: '50px auto',
        backgroundColor: 'var(--card-bg)',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}
    >
      {showBackButton && (
        <Link 
          to="/" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            marginBottom: '20px', 
            textDecoration: 'none', 
            color: 'var(--primary-color)' 
          }}
        >
          <ArrowLeftOutlined style={{ marginRight: '8px' }} />
          {t('backToHome')}
        </Link>
      )}
      
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '24px', 
        color: 'var(--primary-color)' 
      }}>
        {title}
      </h2>
      
      {children}
    </div>
  );
};

export default FormCard;