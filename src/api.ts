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
  }
}; 