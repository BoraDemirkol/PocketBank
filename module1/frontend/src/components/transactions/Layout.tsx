import React from 'react';
import './accountModule.css';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="layout-root">
            <div className="layout-header">
                <h1 className="layout-title">🏦 PocketBank</h1>
            </div>
            {children}
        </div>
    );
};

export default Layout;
