-- SQL Script to create triggers that insert users and accounts only after email verification
-- Run this in your Supabase SQL Editor

-- First, remove any existing auto-insert triggers that might be running on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Function to handle user creation after email verification
CREATE OR REPLACE FUNCTION handle_email_confirmed_user()
RETURNS TRIGGER AS $$
DECLARE
  account_types TEXT[] := ARRAY['Vadeli', 'Vadesiz', 'Kredi Kartı'];
  account_names TEXT[] := ARRAY['Döviz Hesabı', 'Harçlik Hesabı', 'Biriken Hesap'];
  random_account_type TEXT;
  random_account_name TEXT;
  random_balance INTEGER;
  user_exists BOOLEAN;
BEGIN
  -- Log trigger execution for debugging
  RAISE LOG 'Email confirmation trigger fired for user %. Old confirmed_at: %, New confirmed_at: %', 
    NEW.id, OLD.email_confirmed_at, NEW.email_confirmed_at;
  
  -- Only proceed if email was just confirmed (email_confirmed_at changed from NULL to a timestamp)
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    RAISE LOG 'Email confirmed for user %, proceeding with user/account creation', NEW.id;
    
    -- Check if user already exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE id = NEW.id) INTO user_exists;
    
    IF NOT user_exists THEN
      -- Insert user into users table
      INSERT INTO public.users (id, email)
      VALUES (NEW.id, NEW.email);
      
      RAISE LOG 'User % inserted into users table', NEW.id;
      
      -- Generate random account data
      random_account_type := account_types[floor(random() * array_length(account_types, 1)) + 1];
      random_account_name := account_names[floor(random() * array_length(account_names, 1)) + 1];
      random_balance := floor(random() * 25000)::INTEGER; -- Random balance between 0-25000
      
      -- Insert account into accounts table
      INSERT INTO public.accounts (user_id, account_name, account_type, balance, currency)
      VALUES (NEW.id, random_account_name, random_account_type, random_balance, 'TRY');
      
      RAISE LOG 'Account created for user % with type % and balance %', NEW.id, random_account_type, random_balance;
    ELSE
      RAISE LOG 'User % already exists in users table, skipping creation', NEW.id;
    END IF;
    
  ELSE
    RAISE LOG 'Email confirmation trigger fired but conditions not met for user %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table that fires when email_confirmed_at is updated
DROP TRIGGER IF EXISTS on_email_confirmed_create_user ON auth.users;
CREATE TRIGGER on_email_confirmed_create_user
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_confirmed_user();

-- Grant necessary permissions (adjust as needed for your RLS policies)
-- These might need to be adjusted based on your specific RLS setup
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT INSERT ON TABLE public.users TO authenticated;
GRANT INSERT ON TABLE public.accounts TO authenticated;

-- Debug queries to check current state:
-- Run these to see what's happening:

-- 1. Check if there are existing triggers on auth.users
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND event_object_schema = 'auth';

-- 2. Check current users and their email confirmation status
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check users in your public.users table
SELECT * FROM public.users ORDER BY id;

-- 4. Check accounts in your public.accounts table  
SELECT * FROM public.accounts ORDER BY user_id;