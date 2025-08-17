import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'


interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any, needsMFA?: boolean, challengeId?: string, factorId?: string, tempSession?: any }>
  signUp: (email: string, password: string, name: string, surname: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (password: string) => Promise<{ error: any }>
  enrollMFA: () => Promise<{ data: any, error: any }>
  verifyMFA: (factorId: string, challengeId: string, code: string) => Promise<{ error: any }>
  verifyMFAWithSession: (factorId: string, code: string, tempSession: any) => Promise<{ error: any }>
  unenrollMFA: (factorId: string) => Promise<{ error: any }>
  getMFAFactors: () => Promise<{ data: any, error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      return { error }
    }
    
    if (data?.session && data?.user) {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
      
      if (!factorsError && factors?.totp && factors.totp.length > 0) {
        const factor = factors.totp[0];
        await supabase.auth.signOut();
        
        return {
          error: null,
          needsMFA: true,
          challengeId: undefined,
          factorId: factor.id,
          tempSession: { email, password }
        }
      }
    }
    
    return { error: null }
  }

  const signUp = async (email: string, password: string, name: string, surname: string) => {
    try {
      // Check if user already exists in our users table
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        return { error: { message: 'Database error occurred' } };
      }

      if (existingUser) {
        return { error: { message: 'You cant create another account with this mail' } };
      }

      // Try to sign up with Supabase auth
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: {
            name: name,
            surname: surname,
            full_name: `${name} ${surname}`
          }
        }
      });

      if (error) {
        // Handle Supabase auth errors
        if (error.message.includes('already registered') || 
            error.message.includes('already exists') ||
            error.message.includes('already been taken')) {
          return { error: { message: 'You cant create another account with this mail' } };
        }
        return { error };
      }

      return { error: null };
    } catch {
      return { error: { message: 'An unexpected error occurred' } };
    }
  };


  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    })
    return { error }
  }

  const enrollMFA = async () => {
    // Use timestamp to avoid name conflicts
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '');
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `PocketBank_${timestamp}`
    })
    return { data, error }
  }

  const verifyMFA = async (factorId: string, challengeId: string, code: string) => {
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code
    })
    return { error }
  }

  const verifyMFAWithSession = async (factorId: string, code: string, credentials: any) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })
      
      if (error) {
        return { error };
      }
      
      if (!data?.session) {
        return { error: { message: 'Re-authentication failed' } };
      }
      
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId
      })
      
      if (challengeError) {
        return { error: challengeError }
      }
      
      if (!challengeData) {
        return { error: { message: 'Failed to create challenge' } }
      }
      
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
        code: code
      })
      
      return { error: verifyError }
    } catch (err) {
      return { error: err }
    }
  }

  const unenrollMFA = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId
    })
    return { error }
  }

  const getMFAFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      return { data, error }
    } catch (err) {
      return { data: null, error: err }
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    enrollMFA,
    verifyMFA,
    verifyMFAWithSession,
    unenrollMFA,
    getMFAFactors,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
