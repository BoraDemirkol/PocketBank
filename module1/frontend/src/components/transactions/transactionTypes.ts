export interface User {
  id: string;
  email: string;
  name?: string;
  surname?: string;
  profilePictureUrl?: string;
  createdAt?: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt?: string | Date;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  amount: number;  // Keep as number for frontend, backend will convert
  transactionDate: string | Date;
  description: string;
  category?: Category;
  receiptUrl?: string;
  transactionType?: string;
  createdAt?: string | Date;
  // Backend compatibility - remove duplicates
  accountName?: string;
  accountType?: string;
}

export interface Account {
  id: string;
  userId: string;
  accountName: string;
  accountType: string;
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
  startDate: string | Date;
  frequency: string;
  isIncome: boolean;
  isActive: boolean;
  lastProcessed?: string | Date;
  createdAt?: string | Date;
  category?: Category;
  account?: Account;
}

export interface BankStatementTransaction {
  date: string | Date;
  description: string;
  amount: number;
  category: string;
}
