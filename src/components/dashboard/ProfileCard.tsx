import React from 'react';
import { Card, Avatar } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '../ui';

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  surname: string;
  profilePictureUrl?: string;
  message: string;
}

interface ProfileCardProps {
  profile: UserProfile | null;
  userEmail: string | undefined;
  onEditProfile: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, userEmail, onEditProfile }) => {
  const { t } = useTranslation();

  return (
    <Card 
      title={t('editProfile')} 
      variant="outlined"
      extra={
        <PrimaryButton 
          type="text" 
          icon={<EditOutlined />} 
          onClick={onEditProfile}
          style={{ color: 'var(--primary-color)' }}
        >
          {t('edit')}
        </PrimaryButton>
      }
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <Avatar
          size={64}
          src={profile?.profilePictureUrl}
          style={{ backgroundColor: 'var(--primary-color)', marginRight: '16px' }}
        >
          {profile?.name?.[0]?.toUpperCase()}{profile?.surname?.[0]?.toUpperCase()}
        </Avatar>
        <div>
          <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>
            {profile?.name} {profile?.surname}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{userEmail}</p>
        </div>
      </div>
      <p><strong>User ID:</strong> {profile?.userId}</p>
      <p><strong>Status:</strong> {profile?.message}</p>
    </Card>
  );
};

export default ProfileCard;