import { createContext, useState, useEffect, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (
    email: string,
    password: string,
    name?: string,
    surname?: string
  ) => Promise<{ error: Error | null; data?: { user: User | null; session: Session | null } }>
  signOut: () => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (password: string) => Promise<{ error: Error | null }>
  updateProfile: (updates: { name?: string; surname?: string; profilePictureUrl?: string }) => Promise<{ error: Error | null }>
  enableMFA: () => Promise<{ error: Error | null }>
  disableMFA: () => Promise<{ error: Error | null }>
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Only set session if user's email is confirmed
      if (session?.user && session.user.email_confirmed_at) {
        setSession(session)
        setUser(session.user)
      } else if (session?.user && !session.user.email_confirmed_at) {
        // User exists but email not confirmed - sign them out
        console.log('User email not confirmed, signing out');
        supabase.auth.signOut();
        setSession(null)
        setUser(null)
      } else {
        setSession(null)
        setUser(null)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if email is confirmed
        if (session.user.email_confirmed_at) {
          setSession(session)
          setUser(session.user)
        } else {
          // Email not confirmed - sign out
          console.log('User email not confirmed, signing out');
          await supabase.auth.signOut();
          setSession(null)
          setUser(null)
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data.user) {
        // Check if email is confirmed
        if (!data.user.email_confirmed_at) {
          console.log('User email not confirmed, signing out');
          await supabase.auth.signOut();
          return { error: new Error('Email confirmation required. Please check your email and confirm your account.') };
        }
      }

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, name?: string, surname?: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            surname,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })

      if (!error) {
        // Check if email confirmation is required
        if (data.user && !data.user.email_confirmed_at) {
          console.log('Email confirmation required for user:', data.user.id);
          // Don't try to create backend profile until email is confirmed
          return { error: null, data };
        }

        // Try to create user profile in backend only after email confirmation
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/accounts/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({ email, name, surname }),
          })

          if (!response.ok) {
            console.error('Failed to create user profile in backend')
          }
        } catch (profileError) {
          console.error('Failed to create user profile:', profileError)
          // Don't fail the registration if profile creation fails
        }
      }
      
      return { error, data }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const updateProfile = async (updates: { name?: string; surname?: string; profilePictureUrl?: string }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: updates,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const enableMFA = async () => {
    try {
      const { error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const disableMFA = async () => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: 'totp',
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    enableMFA,
    disableMFA,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
