import React from 'react';
import { Card, List } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../ThemeContext';
import { PrimaryButton } from '../ui';
import { Link } from 'react-router-dom'; // <-- DEĞİŞİKLİK 1: Link aracını buraya da import ettik.

// <-- DEĞİŞİKLİK 2: Kuralı güncelledik. Artık 'to' özelliğini de tanıyor.
interface QuickAccessItem {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void; // onClick'i opsiyonel (?) yaptık
  to?: string;          // 'to' özelliğini opsiyonel olarak ekledik
}

interface QuickAccessCardProps {
  items: QuickAccessItem[];
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ items }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const isDarkMode = theme === 'dark';
    e.currentTarget.style.backgroundColor = isDarkMode ? '#404040' : '#f0f8f0';
    e.currentTarget.style.color = isDarkMode ? '#ffffff' : '#4a7c59';
    e.currentTarget.style.transform = 'translateX(4px)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = theme === 'dark' ? '#ffffff' : '#4a7c59';
    e.currentTarget.style.transform = 'translateX(0)';
  };

  return (
    <Card 
      title={t('quick Access') || 'Quick Access'} 
      variant="outlined"
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid var(--border-color, #e8f5e8)',
        backgroundColor: 'var(--card-bg, #ffffff)'
      }}
      styles={{
        header: {
          backgroundColor: 'var(--card-header-bg, #4a7c59)',
          borderBottom: '1px solid var(--border-color, #e8f5e8)',
          borderRadius: '12px 12px 0 0',
          padding: '16px 20px',
          color: '#ffffff'
        },
        body: { padding: '8px' }
      }}
    >
      <List
        dataSource={items}
        split={false}
        // <-- DEĞİŞİKLİK 3: Butonları akıllı hale getirdik.
        renderItem={(item) => {
          const button = (
            <PrimaryButton
              type="text"
              icon={item.icon}
              onClick={item.onClick} // onClick varsa çalışır, yoksa çalışmaz
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
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <span style={{ 
                marginLeft: '12px', 
                letterSpacing: '0.3px',
                lineHeight: '1.4'
              }}>
                {item.title}
              </span>
            </PrimaryButton>
          );
          
          return (
            <List.Item style={{ padding: '4px 0', border: 'none' }}>
              {item.to ? <Link to={item.to} style={{ width: '100%' }}>{button}</Link> : button}
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default QuickAccessCard;