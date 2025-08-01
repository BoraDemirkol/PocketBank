export interface User {
    id: string;
    email: string;
    name?: string;
    surname?: string;
    profilePictureUrl?: string;
    createdAt?: string;
}

export interface Category {
    id: string; // Changed from number to string to match Guid
    userId: string;
    name: string;
    color: string;
    icon: string;
}

export interface Transaction {
    id: string;
    accountId: string;
    categoryId: string;
    amount: number;
    transactionDate: string;
    description: string;
    category?: Category;
    receiptUrl?: string;
    // Backend compatibility aliases
    account_id?: string;
    category_id?: string;
    transaction_date?: string;
    date?: string;
    accountName?: string;
    accountType?: string;
}

export interface Account {
    id: string;
    userId: string;
    accountName: string;
    accountType: 'Vadesiz' | 'Vadeli' | 'Kredi Kartı';
    balance: number;
    currency?: string;
    createdAt?: string;
}

export interface RecurringTransaction {
    id: string;
    description: string;
    amount: number;
    categoryId: string;
    accountId: string;
    startDate: string;
    frequency: string;
    isIncome: boolean;
    isActive: boolean;
    lastProcessed?: string;
    category?: Category;
    account?: Account;
} 