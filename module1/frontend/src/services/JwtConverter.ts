import { supabase } from '../supabase'

class JwtConverter {
  async getAuthHeaders() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No Supabase session available')
      }

      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'X-Auth-Provider': 'supabase',
        'X-User-Id': session.user?.id || ''
      }
    } catch (error) {
      console.error('Failed to get auth headers:', error)
      throw error
    }
  }
}

export const jwtConverter = new JwtConverter()
