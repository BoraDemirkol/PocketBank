import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './ThemeContext';
import TransactionModule from './modules/TransactionModule';
import SupabaseTest from './components/SupabaseTest';
import Dashboard from './Dashboard';
import Module1Home from './Module1Home';
import Login from './Login';
import Register from './Register';
import EditProfile from './EditProfile';
import EmailVerification from './EmailVerification';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { AuthProvider } from './AuthContext';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
    const { t } = useTranslation();

    return (
        <AuthProvider>
            <ThemeProvider>
                <Router>
                    <Layout style={{ minHeight: '100vh' }}>
                        <Header style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            background: '#4a7c59',
                            padding: '0 20px'
                        }}>
                            <Link to="/" style={{ textDecoration: 'none' }}>
                                <Title 
                                    level={3} 
                                    style={{ 
                                        color: 'white', 
                                        margin: 0, 
                                        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                                        fontWeight: 800,
                                        letterSpacing: '2px',
                                        fontSize: '24px',
                                        textTransform: 'uppercase',
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                    }}
                                >
                                    {t('pocketbank')}
                                </Title>
                            </Link>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <LanguageToggle />
                                <ThemeToggle />
                            </div>
                        </Header>
                        <Content style={{ 
                            flex: 1,
                            backgroundColor: 'var(--content-bg)',
                            backgroundImage: `
                                radial-gradient(circle at 25% 25%, rgba(46, 125, 50, 0.08) 0%, transparent 50%),
                                radial-gradient(circle at 75% 75%, rgba(46, 125, 50, 0.06) 0%, transparent 50%),
                                linear-gradient(45deg, rgba(46, 125, 50, 0.02) 25%, transparent 25%),
                                linear-gradient(-45deg, rgba(46, 125, 50, 0.02) 25%, transparent 25%)
                            `,
                            backgroundSize: '200px 200px, 300px 300px, 20px 20px, 20px 20px',
                            padding: '40px'
                        }}>
                            <Routes>
                                <Route path="/" element={<Module1Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/transactions" element={<TransactionModule />} />
                                <Route path="/profile/edit" element={<EditProfile />} />
                                <Route path="/auth/confirm" element={<EmailVerification />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/reset-password" element={<ResetPassword />} />
                                <Route path="/supabase-test" element={<SupabaseTest />} />
                            </Routes>
                        </Content>
                        <Footer style={{ 
                            textAlign: 'center', 
                            backgroundColor: '#4a7c59', 
                            color: 'white',
                            padding: '20px 0'
                        }}>
                            <Typography.Text style={{ color: 'white', fontSize: '14px' }}>
                                {t('copyright')}
                            </Typography.Text>
                        </Footer>
                    </Layout>
                </Router>
            </ThemeProvider>
        </AuthProvider>
    );
};

export default App;
