import { supabase } from '../Shared/supabaseClient';
import { Transaction, Category, Account, RecurringTransaction } from '../types';

// Transaction Services
export const supabaseTransactionService = {
    // Tüm işlemleri getir
    async getTransactions(userId: string): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                categories(name, color, icon),
                accounts(account_name, account_type)
            `)
            .eq('accounts.user_id', userId);

        if (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }

        return data || [];
    },

    // Hesaba göre işlemleri getir
    async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
                *,
                categories(name, color, icon),
                accounts(account_name, account_type)
            `)
            .eq('account_id', accountId);

        if (error) {
            console.error('Error fetching transactions by account:', error);
            return [];
        }

        return data || [];
    },

    // İşlem ekle
    async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction | null> {
        const { data, error } = await supabase
            .from('transactions')
            .insert([{
                account_id: transaction.accountId,
                category_id: transaction.categoryId,
                amount: transaction.amount,
                transaction_date: transaction.transactionDate,
                description: transaction.description,
                receipt_url: transaction.receiptUrl
            }])
            .select()
            .single();

        if (error) {
            console.error('Error adding transaction:', error);
            return null;
        }

        return data;
    },

    // İşlem güncelle
    async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction | null> {
        const { data, error } = await supabase
            .from('transactions')
            .update({
                account_id: transaction.accountId,
                category_id: transaction.categoryId,
                amount: transaction.amount,
                transaction_date: transaction.transactionDate,
                description: transaction.description,
                receipt_url: transaction.receiptUrl
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating transaction:', error);
            return null;
        }

        return data;
    },

    // İşlem sil
    async deleteTransaction(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting transaction:', error);
            return false;
        }

        return true;
    }
};

// Category Services
export const supabaseCategoryService = {
    // Tüm kategorileri getir
    async getCategories(userId: string): Promise<Category[]> {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching categories:', error);
            return [];
        }

        return data || [];
    },

    // Kategori ekle
    async addCategory(category: Omit<Category, 'id'>): Promise<Category | null> {
        const { data, error } = await supabase
            .from('categories')
            .insert([{
                user_id: category.userId,
                name: category.name,
                color: category.color,
                icon: category.icon
            }])
            .select()
            .single();

        if (error) {
            console.error('Error adding category:', error);
            return null;
        }

        return data;
    },

    // Kategori güncelle
    async updateCategory(id: string, category: Partial<Category>): Promise<Category | null> {
        const { data, error } = await supabase
            .from('categories')
            .update({
                name: category.name,
                color: category.color,
                icon: category.icon
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating category:', error);
            return null;
        }

        return data;
    },

    // Kategori sil
    async deleteCategory(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting category:', error);
            return false;
        }

        return true;
    }
};

// Account Services
export const supabaseAccountService = {
    // Tüm hesapları getir
    async getAccounts(userId: string): Promise<Account[]> {
        try {
            console.log('getAccounts called with userId:', userId);
            
            // Her zaman tüm hesapları getir (test için)
            const { data: allAccounts, error: allError } = await supabase
                .from('accounts')
                .select('*');

            if (allError) {
                console.error('Error fetching all accounts:', allError);
                return [];
            }

            console.log('All accounts fetched from Supabase:', allAccounts);
            
            // Account tipine dönüştür
            const convertedAccounts = (allAccounts || []).map(acc => ({
                id: acc.id,
                userId: acc.user_id,
                accountName: acc.account_name,
                accountType: acc.account_type,
                balance: acc.balance,
                currency: acc.currency || 'TRY',
                createdAt: acc.created_at
            }));

            console.log('Converted accounts:', convertedAccounts);
            return convertedAccounts;
        } catch (error) {
            console.error('Error in getAccounts:', error);
            return [];
        }
    },

    // Hesap ekle
    async addAccount(account: Omit<Account, 'id'>): Promise<Account | null> {
        const { data, error } = await supabase
            .from('accounts')
            .insert([{
                user_id: account.userId,
                account_name: account.accountName,
                account_type: account.accountType,
                balance: account.balance,
                currency: account.currency
            }])
            .select()
            .single();

        if (error) {
            console.error('Error adding account:', error);
            return null;
        }

        return data;
    },

    // Hesap güncelle
    async updateAccount(id: string, account: Partial<Account>): Promise<Account | null> {
        const { data, error } = await supabase
            .from('accounts')
            .update({
                account_name: account.accountName,
                account_type: account.accountType,
                balance: account.balance,
                currency: account.currency
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating account:', error);
            return null;
        }

        return data;
    },

    // Hesap sil
    async deleteAccount(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting account:', error);
            return false;
        }

        return true;
    }
};

// Recurring Transaction Services
export const supabaseRecurringTransactionService = {
    // Tüm tekrarlayan işlemleri getir
    async getRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
        const { data, error } = await supabase
            .from('recurring_transactions')
            .select(`
                *,
                categories(name, color, icon),
                accounts(account_name, account_type)
            `)
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching recurring transactions:', error);
            return [];
        }

        return data || [];
    },

    // Tekrarlayan işlem ekle
    async addRecurringTransaction(transaction: Omit<RecurringTransaction, 'id'>): Promise<RecurringTransaction | null> {
        const { data, error } = await supabase
            .from('recurring_transactions')
            .insert([{
                user_id: transaction.userId,
                description: transaction.description,
                amount: transaction.amount,
                category_id: transaction.categoryId,
                account_id: transaction.accountId,
                start_date: transaction.startDate,
                frequency: transaction.frequency,
                is_income: transaction.isIncome,
                is_active: transaction.isActive,
                last_processed: transaction.lastProcessed
            }])
            .select()
            .single();

        if (error) {
            console.error('Error adding recurring transaction:', error);
            return null;
        }

        return data;
    },

    // Tekrarlayan işlem güncelle
    async updateRecurringTransaction(id: string, transaction: Partial<RecurringTransaction>): Promise<RecurringTransaction | null> {
        const { data, error } = await supabase
            .from('recurring_transactions')
            .update({
                description: transaction.description,
                amount: transaction.amount,
                category_id: transaction.categoryId,
                account_id: transaction.accountId,
                start_date: transaction.startDate,
                frequency: transaction.frequency,
                is_income: transaction.isIncome,
                is_active: transaction.isActive,
                last_processed: transaction.lastProcessed
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating recurring transaction:', error);
            return null;
        }

        return data;
    },

    // Tekrarlayan işlem sil
    async deleteRecurringTransaction(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('recurring_transactions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting recurring transaction:', error);
            return false;
        }

        return true;
    }
};

// File Upload Service
export const supabaseFileService = {
    // Dosya yükle
    async uploadFile(file: File, path: string): Promise<string | null> {
        const { data, error } = await supabase.storage
            .from('receipts')
            .upload(`${path}/${Date.now()}_${file.name}`, file);

        if (error) {
            console.error('Error uploading file:', error);
            return null;
        }

        const { data: urlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(data.path);

        return urlData.publicUrl;
    },

    // Dosya sil
    async deleteFile(path: string): Promise<boolean> {
        const { error } = await supabase.storage
            .from('receipts')
            .remove([path]);

        if (error) {
            console.error('Error deleting file:', error);
            return false;
        }

        return true;
    }
};

// Auth Service
export const supabaseAuthService = {
    // Kullanıcı girişi
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        return { data, error };
    },

    // Kullanıcı kaydı
    async signUp(email: string, password: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });

        return { data, error };
    },

    // Çıkış yap
    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    // Mevcut kullanıcıyı al
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    },

    // Auth state değişikliklerini dinle
    onAuthStateChange(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    }
}; 