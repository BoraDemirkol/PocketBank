import { Button, Layout, Typography } from '../node_modules/antd';
import { useState } from 'react';
import Signin from './Signin.tsx'

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

export default function Mainpage() {
    const [showSignin, setShowSignin] = useState(false);

    const handleSignIn = () => {
        setShowSignin(true);
    };

    const handleSignUp = () => {
        console.log('Sign Up clicked');
    };

    const handleLogoClick = () => {
        setShowSignin(false);
    };
    
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ 
                display: 'flex', 
                justifyContent: 'flex-start', 
                alignItems: 'center',
                background: '#4a7c59',
                padding: '0 20px'
            }}>
                <Title 
                    level={3} 
                    onClick={handleLogoClick}
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
                    PocketBank
                </Title>
            </Header>
            <Content style={{ 
                flex: 1,
                backgroundColor: '#f8faf9',
                backgroundImage: `
                    radial-gradient(circle at 25% 25%, rgba(74, 124, 89, 0.08) 0%, transparent 50%),
                    radial-gradient(circle at 75% 75%, rgba(74, 124, 89, 0.06) 0%, transparent 50%),
                    linear-gradient(45deg, rgba(74, 124, 89, 0.02) 25%, transparent 25%),
                    linear-gradient(-45deg, rgba(74, 124, 89, 0.02) 25%, transparent 25%)
                `,
                backgroundSize: '200px 200px, 300px 300px, 20px 20px, 20px 20px',
                padding: '40px'
            }}>
                {!showSignin ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Top half - Text only */}
                        <div style={{ 
                            flex: 1, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            marginBottom: '60px'
                        }}>
                            <Typography.Title level={2} style={{ 
                                textAlign: 'center', 
                                color: '#4a7c59', 
                                marginBottom: '10px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            }}>
                                Bi şeyler yazarız buraya.
                            </Typography.Title>
                            <Typography.Text style={{ 
                                textAlign: 'center', 
                                fontSize: '16px', 
                                color: '#666',
                                maxWidth: '500px'
                            }}>
                                Bla bla bla bla
                            </Typography.Text>
                        </div>

                        {/* Bottom half - Sign in/up boxes */}
                        <div style={{ 
                            flex: 1, 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            gap: '40px'
                        }}>
                            {/* Sign In Box */}
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                padding: '30px',
                                boxShadow: '0 4px 20px rgba(74, 124, 89, 0.1)',
                                width: '280px',
                                minHeight: '180px',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ height: '120px' }}>
                                    <Typography.Title level={4} style={{ 
                                        color: '#4a7c59', 
                                        marginBottom: '15px' 
                                    }}>
                                        Existing Customer
                                    </Typography.Title>
                                    <Typography.Text style={{ 
                                        color: '#666', 
                                        display: 'block', 
                                        marginBottom: '20px',
                                        fontSize: '14px'
                                    }}>
                                        Access your account and manage your finances securely.
                                    </Typography.Text>
                                </div>
                                <Button 
                                    type="default" 
                                    onClick={handleSignIn} 
                                    size="large"
                                    style={{ 
                                        borderColor: '#4a7c59', 
                                        color: '#4a7c59',
                                        fontWeight: 500,
                                        width: '100%'
                                    }}
                                >
                                    Sign In
                                </Button>
                            </div>

                            {/* Sign Up Box */}
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                padding: '30px',
                                boxShadow: '0 4px 20px rgba(74, 124, 89, 0.1)',
                                width: '280px',
                                minHeight: '180px',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ height: '120px' }}>
                                    <Typography.Title level={4} style={{ 
                                        color: '#4a7c59', 
                                        marginBottom: '15px' 
                                    }}>
                                        New Customer
                                    </Typography.Title>
                                    <Typography.Text style={{ 
                                        color: '#666', 
                                        display: 'block', 
                                        marginBottom: '20px',
                                        fontSize: '14px'
                                    }}>
                                        Join thousands who trust PocketBank for their banking needs.
                                    </Typography.Text>
                                </div>
                                <Button 
                                    type="primary" 
                                    onClick={handleSignUp} 
                                    size="large"
                                    style={{ 
                                        backgroundColor: '#4a7c59', 
                                        borderColor: '#4a7c59',
                                        fontWeight: 500,
                                        width: '100%'
                                    }}
                                >
                                    Sign Up
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Signin />
                )}
            </Content>
            <Footer style={{ 
                textAlign: 'center', 
                backgroundColor: '#4a7c59', 
                color: 'white',
                padding: '20px 0'
            }}>
                <Typography.Text style={{ color: 'white', fontSize: '14px' }}>
                    © 2025 PocketBank. All rights reserved.
                </Typography.Text>
            </Footer>
        </Layout>
    );
}
