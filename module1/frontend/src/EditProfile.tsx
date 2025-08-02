import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, message, Form, Input, Upload, Avatar, Spin, Modal, Typography, Space, Divider } from '../node_modules/antd';
import type { UploadChangeParam } from 'antd/es/upload';
import { UserOutlined, ArrowLeftOutlined, UploadOutlined, SaveOutlined, SecurityScanOutlined, QrcodeOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { apiService } from './api';
import { supabase } from './supabase';

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  surname: string;
  profilePictureUrl?: string;
}

const EditProfile: React.FC = () => {
  const { user, enrollMFA, verifyMFA, unenrollMFA, getMFAFactors } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [newProfilePicture, setNewProfilePicture] = useState<string | null>(null);
  const [mfaFactors, setMfaFactors] = useState<Array<{ id: string; friendly_name?: string }>>([]);
  const [mfaModalVisible, setMfaModalVisible] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [currentFactor, setCurrentFactor] = useState<any>(null);

  const loadMFAFactors = useCallback(async () => {
    try {
      const { data, error } = await getMFAFactors();
      if (!error && data) {
        setMfaFactors(data?.totp || []);
      } else {
        // If there's an error or no data, just set empty array
        setMfaFactors([]);
      }
    } catch (error) {
      setMfaFactors([]);
    }
  }, [getMFAFactors]);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await apiService.get('/account/profile');
        setProfile(profileData);
        
        // Load MFA factors but don't let it fail the whole profile load
        try {
          await loadMFAFactors();
        } catch (mfaError) {
          setMfaFactors([]);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        message.error(t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [loadMFAFactors]);


  const handleEnableMFA = async () => {
    try {
      const { data: existingFactors } = await getMFAFactors();
      
      if (existingFactors?.totp && existingFactors.totp.length > 0) {
        for (const factor of existingFactors.totp) {
          try {
            await unenrollMFA(factor.id);
          } catch (cleanupError) {
            console.error('Failed to cleanup factor:', factor.id, cleanupError);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadMFAFactors();
        
        const { data: refreshedFactors } = await getMFAFactors();
        if (refreshedFactors?.totp && refreshedFactors.totp.length > 0) {
          message.error('Failed to clean up existing factors. Please refresh the page and try again.');
          return;
        }
      }

      const { data, error } = await enrollMFA();
      if (error) {
        if (error.message?.includes('MFA is not enabled')) {
          message.error('MFA is not enabled in this project. Please contact support.');
        } else if (error.message?.includes('already exists')) {
          message.error('An MFA factor already exists. Please refresh the page and try again.');
        } else {
          message.error('Failed to enable MFA: ' + error.message);
        }
        return;
      }
      
      if (data) {
        setCurrentFactor(data);
        const qrCodeUrl = data.totp?.qr_code || data.qr_code;
        setQrCode(qrCodeUrl);
        setMfaModalVisible(true);
        
        if (!qrCodeUrl) {
          message.error('Failed to generate QR code');
        }
      }
    } catch {
      message.error('Failed to enable MFA');
    }
  };

  const handleVerifyMFA = async () => {
    if (!currentFactor || !verificationCode) {
      message.error('Please enter the verification code');
      return;
    }

    try {
      // First create a challenge for the factor
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: currentFactor.id
      });

      if (challengeError) {
        message.error('Failed to create challenge: ' + challengeError.message);
        return;
      }

      // Then verify with the challenge ID
      const { error } = await verifyMFA(currentFactor.id, challengeData.id, verificationCode);
      if (error) {
        message.error('Invalid verification code: ' + error.message);
        return;
      }

      message.success('MFA enabled successfully!');
      setMfaModalVisible(false);
      setVerificationCode('');
      setCurrentFactor(null);
      setQrCode(null);
      await loadMFAFactors();
    } catch (err) {
      console.error('MFA verification error:', err);
      message.error('Failed to verify MFA code');
    }
  };

  const handleDisableMFA = async (factorId: string) => {
    try {
      const { error } = await unenrollMFA(factorId);
      if (error) {
        message.error('Failed to disable MFA: ' + error.message);
        return;
      }

      message.success('MFA disabled successfully');
      await loadMFAFactors();
    } catch {
      message.error('Failed to disable MFA');
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Remove folder structure for now

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwrite
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }


      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      message.error(`Failed to upload profile picture: ${(error as Error).message}`);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (info: UploadChangeParam) => {
    // Get the file - it should be the latest file in the fileList
    const file = info.file.originFileObj;
    
    if (!file) {
      return;
    }
    
    // Validate file type
    const isImage = file.type?.startsWith('image/');
    if (!isImage) {
      message.error(t('error'));
      return;
    }

    // Validate file size (max 5MB)
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error(t('error'));
      return;
    }

    const url = await uploadProfilePicture(file);
    
    if (url) {
      setNewProfilePicture(url);
      message.success(t('success'));
    }
  };

  const onFinish = async (values: { name: string; surname: string }) => {
    try {
      setSaving(true);
      
      await apiService.put('/account/profile', {
        name: values.name,
        surname: values.surname,
        profilePictureUrl: newProfilePicture || profile?.profilePictureUrl
      });

      message.success(t('success'));
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to update profile:', error);
      message.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip={t('loading')} />
      </div>
    );
  }

  const currentProfilePicture = newProfilePicture || profile?.profilePictureUrl;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '20px', textDecoration: 'none', color: '#4a7c59' }}>
        <ArrowLeftOutlined style={{ marginRight: '8px' }} />
        {t('backToDashboard')}
      </Link>

      <Card title={t('editProfileTitle')} variant="outlined">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <Avatar
            size={120}
            src={currentProfilePicture}
            style={{ backgroundColor: '#4a7c59', marginBottom: '16px' }}
          >
            {profile?.name?.[0]?.toUpperCase()}{profile?.surname?.[0]?.toUpperCase()}
          </Avatar>
          
          <div>
            <Upload
              showUploadList={false}
              onChange={handleFileChange}
              beforeUpload={() => false} // Prevent automatic upload
            >
              <Button 
                icon={<UploadOutlined />} 
                loading={uploading}
                style={{ borderColor: '#4a7c59', color: '#4a7c59' }}
              >
                {uploading ? t('loading') : t('edit')}
              </Button>
            </Upload>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          key={profile?.userId || 'empty'}
          initialValues={{
            name: profile?.name || '',
            surname: profile?.surname || ''
          }}
        >
          <Form.Item
            name="name"
            label={t('firstName')}
            rules={[{ required: true, message: t('firstNameRequired') }]}
          >
            <Input
              placeholder={t('firstName')}
              prefix={<UserOutlined />}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="surname"
            label={t('lastName')}
            rules={[{ required: true, message: t('lastNameRequired') }]}
          >
            <Input
              placeholder={t('lastName')}
              prefix={<UserOutlined />}
              size="large"
            />
          </Form.Item>

          <Divider orientation="left">
            <SecurityScanOutlined style={{ marginRight: '8px' }} />
            Multi-Factor Authentication
          </Divider>

          <div style={{ marginBottom: '24px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography.Text strong>TOTP (App Authenticator)</Typography.Text>
                  <br />
                  <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                    Requires users to provide additional verification factors to authenticate
                  </Typography.Text>
                </div>
                <div>
                  {mfaFactors.length > 0 ? (
                    <Space>
                      <Typography.Text type="success" style={{ fontSize: '12px' }}>
                        Enabled
                      </Typography.Text>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDisableMFA(mfaFactors[0].id)}
                      >
                        Disable
                      </Button>
                    </Space>
                  ) : (
                    <Button
                      type="primary"
                      size="small"
                      icon={<QrcodeOutlined />}
                      onClick={handleEnableMFA}
                      style={{
                        backgroundColor: '#4a7c59',
                        borderColor: '#4a7c59'
                      }}
                    >
                      Enable
                    </Button>
                  )}
                </div>
              </div>
              
              {mfaFactors.length > 0 && (
                <Typography.Text style={{ fontSize: '12px', color: '#4a7c59' }}>
                  Maximum number of per-user MFA factors: {mfaFactors.length}/10 factors
                </Typography.Text>
              )}
              
            </Space>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              size="large"
              icon={<SaveOutlined />}
              style={{
                width: '100%',
                backgroundColor: '#4a7c59',
                borderColor: '#4a7c59',
                fontWeight: 500
              }}
            >
              {t('saveChanges')}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Modal
        title="Set up Multi-Factor Authentication"
        open={mfaModalVisible}
        onCancel={() => {
          setMfaModalVisible(false);
          setVerificationCode('');
          setCurrentFactor(null);
          setQrCode(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setMfaModalVisible(false);
            setVerificationCode('');
            setCurrentFactor(null);
            setQrCode(null);
          }}>
            Cancel
          </Button>,
          <Button
            key="verify"
            type="primary"
            onClick={handleVerifyMFA}
            style={{
              backgroundColor: '#4a7c59',
              borderColor: '#4a7c59'
            }}
          >
            Verify & Enable
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text>
            1. Install an authenticator app like Google Authenticator, Authy, or 1Password
          </Typography.Text>
          
          <Typography.Text>
            2. Scan this QR code with your authenticator app:
          </Typography.Text>
          
          {qrCode && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <img
                src={qrCode}
                alt="MFA QR Code"
                style={{
                  maxWidth: '200px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px'
                }}
              />
            </div>
          )}
          
          <Typography.Text>
            3. Enter the 6-digit code from your authenticator app:
          </Typography.Text>
          
          <Input
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
            size="large"
            style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '4px' }}
          />
        </Space>
      </Modal>
    </div>
  );
};

export default EditProfile;