import React, { useState, useEffect } from 'react';
import { Card, Button, message, Spin } from 'antd';
import { useAuth } from './AuthContext';
import { apiService } from './api';

interface UserProfile {
  userId: string;
  email: string;
  message: string;
}

interface UserBalance {
  userId: string;
  balance: number;
  currency: string;
}

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile and balance from backend
        const [profileData, balanceData] = await Promise.all([
          apiService.get('/account/profile'),
          apiService.get('/account/balance')
        ]);
        
        setProfile(profileData);
        setBalance(balanceData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        message.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>PocketBank Dashboard</h1>
        <Button onClick={signOut} type="primary" danger>
          Sign Out
        </Button>
      </div>
      
      <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <Card title="Profile" bordered={false}>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>User ID:</strong> {profile?.userId}</p>
          <p><strong>Status:</strong> {profile?.message}</p>
        </Card>
        
        <Card title="Account Balance" bordered={false}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
            ${balance?.balance?.toFixed(2)} {balance?.currency}
          </div>
          <p style={{ marginTop: '10px', color: '#666' }}>
            Available Balance
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;