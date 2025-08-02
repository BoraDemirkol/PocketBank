import { Button, Typography } from '../node_modules/antd';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from 'react-i18next';

export default function Mainpage() {
    const { user, loading } = useAuth();
    const { t } = useTranslation();
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
                    color: 'var(--primary-color)', 
                    marginBottom: '10px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                    {t('welcomeTitle')}
                </Typography.Title>
                <Typography.Text style={{ 
                    textAlign: 'center', 
                    fontSize: '16px', 
                    color: '#666',
                    maxWidth: '500px'
                }}>
                    {t('welcomeSubtitle')}
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
                    <div>{t('loading')}</div>
                ) : user ? (
                    /* Dashboard Box for logged in users */
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '16px',
                        padding: '30px',
                        boxShadow: '0 4px 20px rgba(46, 125, 50, 0.1)',
                        width: '320px',
                        minHeight: '180px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ height: '120px' }}>
                            <Typography.Title level={4} style={{ 
                                color: 'var(--primary-color)', 
                                marginBottom: '15px' 
                            }}>
                                {t('welcomeBack')}
                            </Typography.Title>
                            <Typography.Text style={{ 
                                color: 'var(--text-secondary)', 
                                display: 'block', 
                                marginBottom: '20px',
                                fontSize: '14px'
                            }}>
                                {t('dashboardDescription')}
                            </Typography.Text>
                        </div>
                        <Link to="/dashboard" style={{ width: '100%' }}>
                            <Button 
                                type="primary" 
                                size="large"
                                style={{ 
                                    backgroundColor: 'var(--primary-color)', 
                                    borderColor: 'var(--primary-color)',
                                    fontWeight: 500,
                                    width: '100%'
                                }}
                            >
                                {t('goToDashboard')}
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Sign In Box */}
                        <div style={{
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '16px',
                            padding: '30px',
                            boxShadow: '0 4px 20px rgba(46, 125, 50, 0.1)',
                            width: '280px',
                            minHeight: '180px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ height: '120px' }}>
                                <Typography.Title level={4} style={{ 
                                    color: 'var(--primary-color)', 
                                    marginBottom: '15px' 
                                }}>
                                    {t('existingCustomer')}
                                </Typography.Title>
                                <Typography.Text style={{ 
                                    color: 'var(--text-secondary)', 
                                    display: 'block', 
                                    marginBottom: '20px',
                                    fontSize: '14px'
                                }}>
                                    {t('existingCustomerDescription')}
                                </Typography.Text>
                            </div>
                            <Link to="/signin" style={{ width: '100%' }}>
                                <Button 
                                    type="default" 
                                    size="large"
                                    style={{ 
                                        backgroundColor: 'var(--button-secondary-bg)',
                                        borderColor: 'var(--button-secondary-border)', 
                                        color: 'var(--primary-color)',
                                        fontWeight: 500,
                                        width: '100%'
                                    }}
                                >
                                    {t('signIn')}
                                </Button>
                            </Link>
                        </div>

                        {/* Sign Up Box */}
                        <div style={{
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '16px',
                            padding: '30px',
                            boxShadow: '0 4px 20px rgba(46, 125, 50, 0.1)',
                            width: '280px',
                            minHeight: '180px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ height: '120px' }}>
                                <Typography.Title level={4} style={{ 
                                    color: 'var(--primary-color)', 
                                    marginBottom: '15px' 
                                }}>
                                    {t('newCustomer')}
                                </Typography.Title>
                                <Typography.Text style={{ 
                                    color: 'var(--text-secondary)', 
                                    display: 'block', 
                                    marginBottom: '20px',
                                    fontSize: '14px'
                                }}>
                                    {t('newCustomerDescription')}
                                </Typography.Text>
                            </div>
                            <Link to="/signup" style={{ width: '100%' }}>
                                <Button 
                                    type="primary" 
                                    size="large"
                                    style={{ 
                                        backgroundColor: 'var(--primary-color)', 
                                        borderColor: 'var(--primary-color)',
                                        fontWeight: 500,
                                        width: '100%'
                                    }}
                                >
                                    {t('signUp')}
                                </Button>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
