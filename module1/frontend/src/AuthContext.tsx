import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'


interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
<<<<<<< HEAD
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name: string, surname: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
=======
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
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

<<<<<<< HEAD
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

=======
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
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
<<<<<<< HEAD
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
=======
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
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38


  const signOut = async () => {
    await supabase.auth.signOut()
  }

<<<<<<< HEAD
=======
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

>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
<<<<<<< HEAD
=======
    resetPassword,
    updatePassword,
    enrollMFA,
    verifyMFA,
    verifyMFAWithSession,
    unenrollMFA,
    getMFAFactors,
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
