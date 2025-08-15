import { supabase } from './supabase'
import { jwtConverter } from './services/JwtConverter'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5271/api'

class ApiService {
  private async getAuthHeaders() {
    try {
      // Use the JWT converter to get proper auth headers
      return await jwtConverter.getAuthHeaders()
    } catch (error) {
      console.error('Failed to get auth headers:', error)
      throw new Error('Authentication failed')
    }
  }
  
  async get(endpoint: string) {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async post(endpoint: string, data: Record<string, unknown>) {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async put(endpoint: string, data: Record<string, unknown>) {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async delete(endpoint: string) {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers,
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    
    return response.json()
  }

  async uploadFile(endpoint: string, formData: FormData) {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }
    
    return response.json()
  }
}

export const apiService = new ApiService()