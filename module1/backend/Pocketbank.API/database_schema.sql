-- PocketBank Database Schema
-- This file contains the complete database schema for the PocketBank application

-- Users table (managed by Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(100),
    surname VARCHAR(100),
    profile_picture_url TEXT NOT NULL,
    password_hash TEXT -- Managed by Supabase Auth
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'TRY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    receipt_url TEXT,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense'))
);

-- Recurring Transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    is_income BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_processed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Categories table (junction table for budget-category relationships)
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    limit BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(budget_id, category_id)
);

-- Entity Framework Migrations History table
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" VARCHAR(150) PRIMARY KEY,
    "ProductVersion" VARCHAR(32) NOT NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(account_id) INCLUDE (id, amount, transaction_date, description, created_at, receipt_url, transaction_type);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_account_id ON recurring_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_is_active ON recurring_transactions(is_active);

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_account_date ON transactions(account_id, transaction_date) INCLUDE (amount, description);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_active ON recurring_transactions(user_id, is_active) INCLUDE (amount, description, frequency);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_transactions_composite ON transactions(account_id, transaction_date, transaction_type);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_composite ON recurring_transactions(user_id, is_active, frequency);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active_only ON recurring_transactions(user_id, frequency) WHERE is_active = true;

-- Statistics and maintenance
ANALYZE transactions;
ANALYZE recurring_transactions;
ANALYZE categories;
ANALYZE accounts;

-- Insert default categories for new users (optional)
-- This can be done programmatically in the application when a user is created

