import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import AccountModule from './modules/AccountModule';
import TransactionModule from './modules/TransactionModule'; // yeni eklenecek

const ModuleSelector: React.FC<{ onSelect: (mod: number) => void }> = ({ onSelect }) => {
    const { theme } = useTheme();
    const buttonStyle = {
        padding: '10px 18px',
        fontSize: '1rem',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        marginBottom: '24px',
        marginRight: '16px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        transition: 'background-color 0.3s ease',
        backgroundColor: theme === 'dark' ? '#3a2e5a' : '#6a4ab1',
        color: theme === 'dark' ? '#fff' : '#fff',
    } as React.CSSProperties;
    const buttonHoverStyle = theme === 'dark' ? '#2a2040' : '#573b97';
    return (
        <div style={{ padding: 20 }}>
            <h1>🏦 PocketBank - Modül Seçici</h1>
            <button
                onClick={() => onSelect(2)}
                style={buttonStyle}
                onMouseOver={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = buttonHoverStyle)}
                onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = (buttonStyle as any).backgroundColor)}
            >
                🚀 Modül 2 - Account Management
            </button>
            <button
                onClick={() => onSelect(3)}
                style={buttonStyle}
                onMouseOver={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = buttonHoverStyle)}
                onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = (buttonStyle as any).backgroundColor)}
            >
                💸 Modül 3 - İşlem Yönetimi
            </button>
        </div>
    );
};

const App: React.FC = () => {
    const [activeModule, setActiveModule] = useState<number | null>(null);
    return (
        <ThemeProvider>
            <div>
                {activeModule === null && <ModuleSelector onSelect={setActiveModule} />}
                {activeModule === 2 && <AccountModule />}
                {activeModule === 3 && <TransactionModule />}
            </div>
        </ThemeProvider>
    );
};

export default App;
