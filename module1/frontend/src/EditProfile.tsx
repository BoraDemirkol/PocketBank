import React, { useState, useEffect } from 'react';
import { Card, Button, message, Form, Input, Upload, Avatar, Spin } from '../node_modules/antd';
import { UserOutlined, ArrowLeftOutlined, UploadOutlined, SaveOutlined } from '@ant-design/icons';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [newProfilePicture, setNewProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await apiService.get('/account/profile');
        setProfile(profileData);
        form.setFieldsValue({
          name: profileData.name,
          surname: profileData.surname
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        message.error(t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [form]);

  const uploadProfilePicture = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Remove folder structure for now

      // Upload to Supabase storage
      const { data, error: uploadError } = await supabase.storage
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
      message.error(t('error'));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (info: any) => {
    // Get the file - it should be the latest file in the fileList
    const file = info.file;
    
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
    </div>
  );
};

export default EditProfile;