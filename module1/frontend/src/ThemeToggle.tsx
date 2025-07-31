import React from 'react';
import { Button } from '../node_modules/antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from './ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      type="text"
      icon={theme === 'dark' ? <MoonOutlined /> : <SunOutlined />}
      onClick={toggleTheme}
      style={{
        color: 'white',
        border: 'none',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    />
  );
};

export default ThemeToggle;