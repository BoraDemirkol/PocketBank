import { supabase } from './supabase';

export const apiService = {
  async updateProfile(userId: string, profile: any) {
    const { data, error } = await supabase
      .from('users')
      .update(profile)
      .eq('id', userId);
    
    if (error) throw error;
    return data;
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // HTTP methods for compatibility
  async get(endpoint: string) {
    // For now, return mock data or redirect to Supabase
    if (endpoint === '/account/profile') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return this.getProfile(user.id);
      }
      return null;
    }
    if (endpoint === '/account/balance') {
      // Mock balance data
      return { balance: 1000, currency: 'USD' };
    }
    throw new Error(`GET ${endpoint} not implemented`);
  },

  async put(endpoint: string, data: any) {
    if (endpoint === '/account/profile') {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return this.updateProfile(user.id, data);
      }
      throw new Error('User not authenticated');
    }
    throw new Error(`PUT ${endpoint} not implemented`);
  },

  async post(endpoint: string, data: any) {
    throw new Error(`POST ${endpoint} not implemented`);
  },

  async delete(endpoint: string) {
    throw new Error(`DELETE ${endpoint} not implemented`);
  }
}; 