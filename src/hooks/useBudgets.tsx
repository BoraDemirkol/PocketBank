// src/hooks/useBudgets.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Database row types
interface BudgetRow {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  period: string;
}
interface CategoryRow {
  id: string;
  name: string;
}
interface BudgetCategoryRow {
  budget_id: string;
  category_id: string;
  limit: number;
  // Supabase returns related rows as an array
  categories: { name: string }[] | null;
}
interface TransactionRow {
  account_id: string;
  amount: number;
  description: string;
}
interface AccountRow {
  id: string;
  user_id: string;
}

// Frontend models
export interface Category {
  name: string;
  limit: number;
  spent: number;
}
export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  period: string;
  categories: Category[];
  totalSpent: number;
}

// Classify transaction by description
function classifyCategoryFromDescription(
  description: string,
  categoryNames: string[]
): string | null {
  const lower = description.toLowerCase();
  for (const c of categoryNames) {
    if (lower.includes(c.toLowerCase())) return c;
  }
  return null;
}

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBudgets = async () => {
      setLoading(true);
      try {
        // Fetch budgets
        const { data: budgetsData, error: budgetsErr } = await supabase
          .from<'budgets', BudgetRow>('budgets')
          .select('id, user_id, name, amount, period');
        if (budgetsErr || !budgetsData) throw budgetsErr;

        // Fetch accounts
        const { data: accountsData, error: accountsErr } = await supabase
          .from<'accounts', AccountRow>('accounts')
          .select('id, user_id');
        if (accountsErr || !accountsData) throw accountsErr;

        // Map accounts by user
        const userToAccounts: Record<string, string[]> = {};
        accountsData.forEach(a => {
          userToAccounts[a.user_id] = userToAccounts[a.user_id] || [];
          userToAccounts[a.user_id].push(a.id);
        });

        // Fetch transactions
        const { data: txData, error: txErr } = await supabase
          .from<'transactions', TransactionRow>('transactions')
          .select('account_id, amount, description');
        if (txErr || !txData) throw txErr;

        // Classify and sum spent per user and per category
        const totalSpentMap: Record<string, number> = {};
        const spentByCategory: Record<string, Record<string, number>> = {};

        // Get all category names
        const { data: catRows, error: catErr } = await supabase
          .from<'categories', CategoryRow>('categories')
          .select('id, name');
        if (catErr || !catRows) throw catErr;
        const categoryNames = catRows.map(c => c.name);

        // Classify each transaction
        txData.forEach(tx => {
          const account = accountsData.find(a => a.id === tx.account_id);
          const userId = account?.user_id;
          if (!userId) return;
          // total spent per user
          totalSpentMap[userId] = (totalSpentMap[userId] || 0) - tx.amount;
          // categorize
          const catName = classifyCategoryFromDescription(tx.description, categoryNames);
          if (catName) {
            spentByCategory[userId] = spentByCategory[userId] || {};
            spentByCategory[userId][catName] = (spentByCategory[userId][catName] || 0) - tx.amount;
          }
        });

        // Fetch budget_categories with join to categories
        const { data: bcData, error: bcErr } = await supabase
          .from<'budget_categories', BudgetCategoryRow>('budget_categories')
          .select('budget_id, category_id, limit, categories(name)');
        if (bcErr || !bcData) throw bcErr;

        // Organize categories per budget
        const budgetCategoryMap: Record<string, Category[]> = {};
        bcData.forEach(entry => {
          const catArray = entry.categories || [];
          const catName = catArray.length ? catArray[0].name : 'Unknown';
          const spent =
            budgetsData
              .find(b => b.id === entry.budget_id)
              ?.user_id in spentByCategory
              ? spentByCategory[
                  budgetsData.find(b => b.id === entry.budget_id)!.user_id
                ][catName] || 0
              : 0;
          const category: Category = { name: catName, limit: entry.limit, spent };
          budgetCategoryMap[entry.budget_id] = budgetCategoryMap[entry.budget_id] || [];
          budgetCategoryMap[entry.budget_id].push(category);
        });

        // Assemble final budgets
        const finalBudgets: Budget[] = budgetsData.map(b => {
          const cats = budgetCategoryMap[b.id] || [];
          const spentSum = cats.reduce((sum, c) => sum + c.spent, 0);
          const totalUserSpent = totalSpentMap[b.user_id] || 0;
          return {
            id: b.id,
            name: b.name,
            amount: b.amount,
            spent: spentSum,
            period: b.period,
            categories: cats,
            totalSpent: totalUserSpent
          };
        });

        setBudgets(finalBudgets);
        setError(null);
      } catch (e: any) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, []);

  return { budgets, loading, error };
};
