import React from 'react';
import { Card, Button, Row, Col, Typography, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Module1Home: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto', 
            padding: '40px 20px',
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <Title level={1} style={{ 
                    color: '#4a7c59', 
                    marginBottom: '20px',
                    fontSize: '3rem',
                    fontWeight: 'bold'
                }}>
                    🏦 PocketBank
                </Title>
                <Paragraph style={{ 
                    fontSize: '1.2rem', 
                    color: '#666',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    Güvenilir dijital bankacılık çözümünüz. Finanslarınızı yönetmek için güvenli ve kullanıcı dostu platform.
                </Paragraph>
            </div>

            <Row gutter={[32, 32]} justify="center">
                <Col xs={24} sm={12} md={8}>
                    <Card 
                        hoverable
                        style={{ 
                            textAlign: 'center',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            border: 'none'
                        }}
                        onClick={() => navigate('/login')}
                    >
                        <div style={{ marginBottom: '20px' }}>
                            <UserOutlined style={{ fontSize: '48px', color: '#4a7c59' }} />
                        </div>
                        <Title level={3} style={{ color: '#4a7c59', marginBottom: '10px' }}>
                            Mevcut Müşteri
                        </Title>
                        <Paragraph style={{ color: '#666', marginBottom: '20px' }}>
                            Hesabınıza erişin ve finanslarınızı güvenle yönetin.
                        </Paragraph>
                        <Button 
                            type="primary" 
                            size="large"
                            icon={<LoginOutlined />}
                            style={{ 
                                backgroundColor: '#4a7c59',
                                borderColor: '#4a7c59',
                                borderRadius: '6px',
                                height: '48px',
                                fontSize: '16px'
                            }}
                            onClick={() => navigate('/login')}
                        >
                            Giriş Yap
                        </Button>
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={8}>
                    <Card 
                        hoverable
                        style={{ 
                            textAlign: 'center',
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            border: 'none'
                        }}
                        onClick={() => navigate('/register')}
                    >
                        <div style={{ marginBottom: '20px' }}>
                            <UserAddOutlined style={{ fontSize: '48px', color: '#4a7c59' }} />
                        </div>
                        <Title level={3} style={{ color: '#4a7c59', marginBottom: '10px' }}>
                            Yeni Müşteri
                        </Title>
                        <Paragraph style={{ color: '#666', marginBottom: '20px' }}>
                            Binlerce kişiye katılın ve PocketBank'ın güvenilir hizmetlerinden yararlanın.
                        </Paragraph>
                        <Button 
                            type="primary" 
                            size="large"
                            icon={<UserAddOutlined />}
                            style={{ 
                                backgroundColor: '#4a7c59',
                                borderColor: '#4a7c59',
                                borderRadius: '6px',
                                height: '48px',
                                fontSize: '16px'
                            }}
                            onClick={() => navigate('/register')}
                        >
                            Kayıt Ol
                        </Button>
                    </Card>
                </Col>
            </Row>

            <div style={{ 
                textAlign: 'center', 
                marginTop: '60px',
                padding: '40px',
                backgroundColor: 'rgba(74, 124, 89, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(74, 124, 89, 0.1)'
            }}>
                <Title level={4} style={{ color: '#4a7c59', marginBottom: '20px' }}>
                    Neden PocketBank?
                </Title>
                <Row gutter={[24, 24]} justify="center">
                    <Col xs={24} sm={8}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔒</div>
                            <Title level={5}>Güvenli</Title>
                            <Paragraph style={{ color: '#666' }}>
                                En son güvenlik teknolojileri ile korunan hesaplarınız
                            </Paragraph>
                        </div>
                    </Col>
                    <Col xs={24} sm={8}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚡</div>
                            <Title level={5}>Hızlı</Title>
                            <Paragraph style={{ color: '#666' }}>
                                Anında işlemler ve gerçek zamanlı güncellemeler
                            </Paragraph>
                        </div>
                    </Col>
                    <Col xs={24} sm={8}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📱</div>
                            <Title level={5}>Kullanıcı Dostu</Title>
                            <Paragraph style={{ color: '#666' }}>
                                Modern ve sezgisel arayüz tasarımı
                            </Paragraph>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default Module1Home; 