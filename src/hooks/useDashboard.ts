import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '../AuthContext';
import { apiService } from '../api';
import { ROUTES } from '../utils/constants';

interface UserProfile {
  userId: string;
  email: string;
  name: string;
  surname: string;
  profilePictureUrl?: string;
  message: string;
}

interface UserBalance {
  userId: string;
  balance: number;
  currency: string;
}

interface DashboardState {
  profile: UserProfile | null;
  balance: UserBalance | null;
  loading: boolean;
  logoutLoading: boolean;
  showLogoutDialog: boolean;
}

export const useDashboard = () => {
  const [state, setState] = useState<DashboardState>({
    profile: null,
    balance: null,
    loading: true,
    logoutLoading: false,
    showLogoutDialog: false
  });

  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        
        const [profileData, balanceData] = await Promise.all([
          apiService.get('/account/profile'),
          apiService.get('/account/balance')
        ]);
        
        setState(prev => ({
          ...prev,
          profile: profileData,
          balance: balanceData
        }));
      } catch {
        message.error('Failed to load dashboard data');
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, []);

  const handleSignOut = async () => {
    setState(prev => ({ ...prev, logoutLoading: true }));
    
    try {
      await signOut();
      navigate(ROUTES.HOME);
    } catch {
      message.error('Failed to logout');
    } finally {
      setState(prev => ({ 
        ...prev, 
        logoutLoading: false, 
        showLogoutDialog: false 
      }));
    }
  };

  const showLogoutConfirmation = () => {
    setState(prev => ({ ...prev, showLogoutDialog: true }));
  };

  const hideLogoutConfirmation = () => {
    setState(prev => ({ ...prev, showLogoutDialog: false }));
  };

  const navigateToProfile = () => {
    navigate(ROUTES.PROFILE_EDIT);
  };

  return {
    ...state,
    handleSignOut,
    showLogoutConfirmation,
    hideLogoutConfirmation,
    navigateToProfile
  };
};