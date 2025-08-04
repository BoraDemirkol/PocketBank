import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import TransactionModule from './modules/TransactionModule';
import SupabaseTest from './components/SupabaseTest';

const App: React.FC = () => {
    const [showTest, setShowTest] = useState(false);

    return (
        <ThemeProvider>
            <div>
                {!showTest ? (
                    <>
                        <div style={{ 
                            padding: '10px', 
                            backgroundColor: '#007bff', 
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0 }}>PocketBank - Kişisel Finans Yönetimi</h3>
                            <button 
                                onClick={() => setShowTest(true)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                🔧 Supabase Test
                            </button>
                        </div>
                        <TransactionModule />
                    </>
                ) : (
                    <>
                        <div style={{ 
                            padding: '10px', 
                            backgroundColor: '#28a745', 
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0 }}>Supabase Entegrasyon Testi</h3>
                            <button 
                                onClick={() => setShowTest(false)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                ← Ana Sayfaya Dön
                            </button>
                        </div>
                        <SupabaseTest />
                    </>
                )}
            </div>
        </ThemeProvider>
    );
};

export default App;
