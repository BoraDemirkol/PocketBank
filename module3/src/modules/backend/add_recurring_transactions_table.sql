-- Add recurring_transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    account_id uuid NOT NULL,
    category_id uuid NOT NULL,
    description character varying(500) NOT NULL,
    amount numeric(18,2) NOT NULL,
    start_date timestamp with time zone NOT NULL,
    frequency character varying(20) NOT NULL,
    is_income boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    last_processed timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_recurring_transactions" PRIMARY KEY (id),
    CONSTRAINT "FK_recurring_transactions_users_user_id" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT "FK_recurring_transactions_accounts_account_id" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT "FK_recurring_transactions_categories_category_id" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
); 