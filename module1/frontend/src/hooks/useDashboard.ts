import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '../AuthContext';
<<<<<<< HEAD
import { supabase } from '../supabase';
=======
import { apiService } from '../api';
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
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
<<<<<<< HEAD
    const fetchFromSupabase = async (): Promise<{ profile: UserProfile | null; balance: UserBalance | null }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const [profileResponse, balanceResponse] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('accounts').select('*').eq('user_id', user.id).single()
      ]);

      if (profileResponse.error && balanceResponse.error) {
        throw new Error('Failed to fetch from Supabase');
      }

      return {
        profile: profileResponse.data ? {
          userId: profileResponse.data.id,
          email: profileResponse.data.email || user.email || '',
          name: profileResponse.data.name || '',
          surname: profileResponse.data.surname || '',
          profilePictureUrl: profileResponse.data.profile_picture_url,
          message: 'Welcome to PocketBank!'
        } : null,
        balance: balanceResponse.data ? {
          userId: balanceResponse.data.user_id,
          balance: balanceResponse.data.balance || 0,
          currency: balanceResponse.data.currency || 'TRY'
        } : null
      };
    };

    const fetchFromLocalStorage = (): { profile: UserProfile | null; balance: UserBalance | null } => {
      const storedProfile = localStorage.getItem('dashboardProfile');
      const storedBalance = localStorage.getItem('dashboardBalance');
      
      return {
        profile: storedProfile ? JSON.parse(storedProfile) : null,
        balance: storedBalance ? JSON.parse(storedBalance) : null
      };
    };

    const saveToLocalStorage = (profile: UserProfile | null, balance: UserBalance | null) => {
      if (profile) localStorage.setItem('dashboardProfile', JSON.stringify(profile));
      if (balance) localStorage.setItem('dashboardBalance', JSON.stringify(balance));
    };

=======
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
    const fetchDashboardData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true }));
        
<<<<<<< HEAD
        try {
          const supabaseData = await fetchFromSupabase();
          saveToLocalStorage(supabaseData.profile, supabaseData.balance);
          
          setState(prev => ({
            ...prev,
            profile: supabaseData.profile,
            balance: supabaseData.balance
          }));
        } catch (supabaseError) {
          console.warn('Supabase fetch failed, trying local storage:', supabaseError);
          
          const localData = fetchFromLocalStorage();
          
          if (localData.profile || localData.balance) {
            setState(prev => ({
              ...prev,
              profile: localData.profile,
              balance: localData.balance
            }));
            message.warning('Loaded data from local storage');
          } else {
            throw new Error('No data available from Supabase or local storage');
          }
        }
=======
        const [profileData, balanceData] = await Promise.all([
          apiService.get('/account/profile'),
          apiService.get('/account/balance')
        ]);
        
        setState(prev => ({
          ...prev,
          profile: profileData,
          balance: balanceData
        }));
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
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