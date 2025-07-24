import React from 'react';
import { useTheme } from './ThemeContext';
import './Layout.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className={`layout-root ${theme}`}>
            <div className="layout-header">
                <h1 className="layout-title">🏦 PocketBank</h1>
                <button
                    onClick={toggleTheme}
                    className="theme-toggle-btn"
                >
                    {theme === 'dark' ? '☀️ Aydınlık Mod' : '🌙 Karanlık Mod'}
                </button>
            </div>

            {children}
        </div>
    );
};

export default Layout;
