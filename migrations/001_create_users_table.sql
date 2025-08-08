-- Migration: Create users and accounts tables for local PostgreSQL
-- This matches the existing Supabase structure and triggers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table matching the Supabase public.users structure
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL DEFAULT '',
    surname VARCHAR(100) NOT NULL DEFAULT '',
    profile_picture_url TEXT DEFAULT 'https://ui-avatars.com/api/?name=User&background=4a7c59&color=fff&size=200',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create accounts table matching the Supabase structure
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    balance INTEGER DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'TRY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Sample data for testing (can be removed in production)
INSERT INTO users (id, email, name, surname) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test', 'User')
ON CONFLICT (id) DO NOTHING;

-- Sample account data
INSERT INTO accounts (user_id, account_name, account_type, balance, currency) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Harçlik Hesabı', 'Vadesiz', 15000, 'TRY')
ON CONFLICT (id) DO NOTHING;