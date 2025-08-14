import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'


interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string, surname: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper function to sync user data to local PostgreSQL database
const syncUserToLocalDatabase = async (user: User, name: string, surname: string) => {
  const response = await fetch('http://localhost:5271/api/webhook/test-user-creation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: user.id,
      email: user.email,
      name: name,
      surname: surname,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to sync user to local database: ${response.status}`)
  }

  const result = await response.json()
  console.log('User synced to local database:', result)
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // If signin successful and user exists, ensure they're synced to local database
    if (!error && data.user) {
      try {
        const name = data.user.user_metadata?.name || ''
        const surname = data.user.user_metadata?.surname || ''
        await syncUserToLocalDatabase(data.user, name, surname)
      } catch (syncError) {
        console.error('Failed to sync user to local database:', syncError)
        // Don't fail the signin if local sync fails
      }
    }

    return { error }
  }

  const signUp = async (email: string, password: string, name: string, surname: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          surname: surname,
          full_name: `${name} ${surname}`
        }
      }
    })

    // If signup successful and user exists, sync to local database
    if (!error && data.user) {
      try {
        await syncUserToLocalDatabase(data.user, name, surname)
      } catch (syncError) {
        console.error('Failed to sync user to local database:', syncError)
        // Don't fail the signup if local sync fails
      }
    }

    return { error }
  }


  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
