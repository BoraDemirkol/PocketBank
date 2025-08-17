export interface User {
    id: string;
    email: string;
    name?: string;
    surname?: string;
    profilePictureUrl: string;
    passwordHash?: string;
    createdAt?: string;
}

export interface Category {
    id: string;
    userId?: string;
    name: string;
    color?: string;
    icon?: string;
    createdAt?: string;
}

export interface Transaction {
    id: string;
    accountId?: string;
    categoryId?: string;
    amount: number;
    transactionDate: string;
    description?: string;
    createdAt?: string;
    receiptUrl?: string;
    transactionType?: string;
    category?: Category;
    account?: Account;
}

export interface Account {
    id: string;
    userId?: string;
    accountName: string;
    accountType: string;
    balance?: number;
    currency?: string;
    createdAt?: string;
}

export interface RecurringTransaction {
    id: string;
    userId: string;
    description: string;
    amount: number;
    categoryId: string;
    accountId: string;
    startDate: string;
    frequency: string;
    isIncome: boolean;
    isActive: boolean;
    lastProcessed?: string;
    createdAt: string;
    category?: Category;
    account?: Account;
}

export interface Budget {
    id: string;
    userId?: string;
    name: string;
    amount: number;
    period: string;
    startDate: string;
    createdAt?: string;
}

export interface BudgetCategory {
    id: string;
    budgetId?: string;
    categoryId?: string;
    limit?: number;
    createdAt: string;
}
