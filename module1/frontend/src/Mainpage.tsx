import { Button, Typography } from '../node_modules/antd';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function Mainpage() {
    const { user, loading } = useAuth();
    return (
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

            {/* Bottom half - Conditional content based on authentication */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                gap: '40px'
            }}>
                {loading ? (
                    <div>Loading...</div>
                ) : user ? (
                    /* Dashboard Box for logged in users */
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '30px',
                        boxShadow: '0 4px 20px rgba(74, 124, 89, 0.1)',
                        width: '320px',
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
                                Welcome Back!
                            </Typography.Title>
                            <Typography.Text style={{ 
                                color: '#666', 
                                display: 'block', 
                                marginBottom: '20px',
                                fontSize: '14px'
                            }}>
                                Access your dashboard to manage your finances and view your account details.
                            </Typography.Text>
                        </div>
                        <Link to="/dashboard" style={{ width: '100%' }}>
                            <Button 
                                type="primary" 
                                size="large"
                                style={{ 
                                    backgroundColor: '#4a7c59', 
                                    borderColor: '#4a7c59',
                                    fontWeight: 500,
                                    width: '100%'
                                }}
                            >
                                Go to Dashboard
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
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
                            <Link to="/signin" style={{ width: '100%' }}>
                                <Button 
                                    type="default" 
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
                            </Link>
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
                            <Link to="/signup" style={{ width: '100%' }}>
                                <Button 
                                    type="primary" 
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
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
