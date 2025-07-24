import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import AccountModule from './modules/AccountModule';

const App: React.FC = () => {
    const [activeModule, setActiveModule] = useState(false);

    return (
        <ThemeProvider>
            <div>
                {!activeModule && (
                    <div style={{ padding: 20 }}>
                        <h1>🏦 PocketBank - Modül Seçici</h1>
                        <button
                            onClick={() => setActiveModule(true)}
                            style={{
                                padding: '10px 18px',
                                backgroundColor: '#6a4ab1',
                                color: '#fff',
                                fontSize: '1rem',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                marginBottom: '24px',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                transition: 'background-color 0.3s ease'
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#573b97')}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6a4ab1')}
                        >
                            🚀 Modül 2 - Account Management
                        </button>
                    </div>
                )}

                {activeModule && <AccountModule />}
            </div>
        </ThemeProvider>
    );
};

export default App;
