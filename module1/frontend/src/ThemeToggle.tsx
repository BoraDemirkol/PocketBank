import React from 'react';
import { Button } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from './hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      type="text"
      icon={isDark ? <MoonOutlined /> : <SunOutlined />}
      onClick={toggleTheme}
      style={{
        color: 'white',
        border: 'none',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    />
  );
};

export default ThemeToggle;