import { supabase } from './supabase'

const API_BASE_URL = '/api' // Using Vite proxy

class ApiService {
  async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }
  
  async get(endpoint: string) {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    })
    
    if (!response.ok) {
      let errorMessage = `API request failed: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        errorMessage += ` - ${JSON.stringify(errorData)}`
      } catch {
        // If error response is not JSON, try to get text
        try {
          const errorText = await response.text()
          errorMessage += ` - ${errorText}`
        } catch {
          // Ignore if we can't read error response
        }
      }
      
      throw new Error(errorMessage)
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

  // Test method for CORS
  async testCors() {
    try {
      const response = await fetch(`${API_BASE_URL}/account/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`CORS test failed: ${response.statusText} - ${errorText}`)
      }
      
      return response.json()
    } catch (error) {
      console.error('CORS test error:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()