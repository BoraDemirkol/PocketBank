import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    try {
      console.log('🔵 Starting signup process for:', email);
      
      // Check if user already exists in our users table
      console.log('🔍 Checking if user exists in users table...');
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ Error checking existing user:', selectError);
        return { error: { message: 'Database error occurred' } };
      }

      if (existingUser) {
        console.log('❌ User already exists in users table');
        return { error: { message: 'You cant create another account with this mail' } };
      }

      console.log('✅ No existing user found, proceeding with auth signup...');

      // Try to sign up with Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) {
        console.error('❌ Supabase auth signup error:', error);
        // Handle Supabase auth errors
        if (error.message.includes('already registered') || 
            error.message.includes('already exists') ||
            error.message.includes('already been taken')) {
          return { error: { message: 'You cant create another account with this mail' } };
        }
        return { error };
      }

      const user = data.user;
      console.log('✅ Auth user created successfully:', user?.id);

      // Insert user into our users table
      if (user && user.email) {
        console.log('📝 Inserting user into users table...');
        const userRecord = {
          id: user.id,
          email: user.email,
        };
        console.log('User record to insert:', userRecord);

        const { error: insertError } = await supabase.from('users').insert([userRecord]);

        if (insertError) {
          console.error('❌ Users table insert error:', insertError);
          console.error('Full error details:', JSON.stringify(insertError, null, 2));
          
          // If insert fails due to duplicate, it means user already exists
          if (insertError.code === '23505') { // Unique constraint violation
            return { error: { message: 'You cant create another account with this mail' } };
          }
          return { error: { message: `Failed to create user profile: ${insertError.message}` } };
        }

        console.log('✅ User inserted into users table successfully');

        // Generate randomized account data
        const accountTypes = ['Vadeli', 'Vadesiz', 'Kredi Kartı'];
        const accountNames = ['Döviz Hesabı', 'Harçlik Hesabı', 'Biriken Hesap'];
        
        const randomAccountType = accountTypes[Math.floor(Math.random() * accountTypes.length)];
        const randomAccountName = accountNames[Math.floor(Math.random() * accountNames.length)];
        const randomBalance = Math.floor(Math.random() * 25000); // Random balance between 0-25000
        
        console.log('💳 Creating account with data:', {
          user_id: user.id,
          account_name: randomAccountName,
          account_type: randomAccountType,
          balance: randomBalance,
          currency: 'TRY'
        });
        
        // Insert random account data
        const { error: accountInsertError } = await supabase.from('accounts').insert([
          {
            user_id: user.id,
            account_name: randomAccountName,
            account_type: randomAccountType,
            balance: randomBalance,
            currency: 'TRY'
          }
        ]);

        if (accountInsertError) {
          console.error('❌ Account insert error:', accountInsertError);
          console.error('Full account error details:', JSON.stringify(accountInsertError, null, 2));
          return { error: { message: `Failed to create account: ${accountInsertError.message}` } };
        }

        console.log('✅ Account created successfully');
      } else {
        console.error('❌ No user data returned from auth signup');
        return { error: { message: 'No user data received from authentication' } };
      }

      console.log('🎉 Signup process completed successfully');
      return { error: null };
    } catch (err) {
      console.error('❌ Unexpected signup error:', err);
      return { error: { message: 'An unexpected error occurred' } };
    }
  };


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
