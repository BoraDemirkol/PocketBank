import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Define types for your database rows
type BudgetRow = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  period: string;
};

type CategoryRow = {
  id: string;
  name: string;
};

type BudgetCategoryRow = {
  budget_id: string;
  category_id: string;
  limit: number;
  categories: {
    name: string;
  } | null; // null if no join found
};

type TransactionRow = {
  account_id: string;
  amount: number;
  description: string;
};

type AccountRow = {
  id: string;
  user_id: string;
};

interface Category {
  name: string;
  limit: number;
  spent: number;
}

interface Budget {
  id: string;
  name: string;
  amount: number;
  period: string;
  categories: Category[];
  totalSpent: number;
}

/**
 * Classify transaction description by matching category names (case-insensitive).
 */
function classifyCategoryFromDescription(
  description: string,
  categoryNames: string[]
): string | null {
  const lowerDesc = description.toLowerCase();
  for (const category of categoryNames) {
    if (lowerDesc.includes(category.toLowerCase())) {
      return category;
    }
  }
  return null;
}

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBudgets = async () => {
      setLoading(true);

      const { data: budgetsDataRaw, error: budgetsError } = await supabase
        .from<'budgets', BudgetRow>('budgets')
        .select('id, user_id, name, amount, period');

      if (budgetsError || !budgetsDataRaw) {
        console.error('Error fetching budgets:', budgetsError);
        setLoading(false);
        return;
      }
      const budgetsData = budgetsDataRaw;
      const userIds = Array.from(new Set(budgetsData.map((b) => b.user_id)));

      const { data: accountsDataRaw, error: accountsError } = await supabase
        .from<'accounts', AccountRow>('accounts')
        .select('id, user_id');

      if (accountsError || !accountsDataRaw) {
        console.error('Error fetching accounts:', accountsError);
        setLoading(false);
        return;
      }

      const userToAccountsMap: Record<string, string[]> = {};
      for (const acc of accountsDataRaw) {
        if (!userToAccountsMap[acc.user_id]) userToAccountsMap[acc.user_id] = [];
        userToAccountsMap[acc.user_id].push(acc.id);
      }

      const { data: transactionsDataRaw, error: transactionsError } = await supabase
        .from<'transactions', TransactionRow>('transactions')
        .select('account_id, amount, description');

      if (transactionsError || !transactionsDataRaw) {
        console.error('Error fetching transactions:', transactionsError);
        setLoading(false);
        return;
      }
      const transactionsData = transactionsDataRaw;

      const { data: categoriesDataRaw, error: categoriesError } = await supabase
        .from<'categories', CategoryRow>('categories')
        .select('id, name');

      if (categoriesError || !categoriesDataRaw) {
        console.error('Error fetching categories:', categoriesError);
        setLoading(false);
        return;
      }
      const categoriesData = categoriesDataRaw;
      const categoryNames = categoriesData.map((c) => c.name);

      const { data: bcDataRaw, error: bcError } = await supabase
        .from<'budget_categories', BudgetCategoryRow>('budget_categories')
        .select('budget_id, category_id, limit, categories(name)');

      if (bcError || !bcDataRaw) {
        console.error('Error fetching budget_categories:', bcError);
        setLoading(false);
        return;
      }
      const bcData = bcDataRaw;

      const classifiedTransactions = transactionsData.map((tx) => {
        const matchedCategory = classifyCategoryFromDescription(tx.description, categoryNames);
        return {
          ...tx,
          category: matchedCategory,
        };
      });

      const spentMap: Record<string, Record<string, number>> = {};
      const totalSpentMap: Record<string, number> = {};

      for (const tx of classifiedTransactions) {
        const accountId = tx.account_id;
        const account = accountsDataRaw.find((a) => a.id === accountId);
        const userId = account?.user_id;
        if (!userId) continue;

        if (!totalSpentMap[userId]) totalSpentMap[userId] = 0;
        totalSpentMap[userId] -= tx.amount;

        if (tx.category) {
          if (!spentMap[userId]) spentMap[userId] = {};
          if (!spentMap[userId][tx.category]) spentMap[userId][tx.category] = 0;
          spentMap[userId][tx.category] -= tx.amount;
        }
      }

      console.log('Total spent map:', totalSpentMap);
      console.log('Spent map:', spentMap);

      const budgetCategoryMap: Record<string, Category[]> = {};
      for (const entry of bcData) {
        const budgetId = entry.budget_id;
        const categoryName = entry.categories?.name ?? 'Unknown';
        const limit = entry.limit;

        const budgetOwner = budgetsData.find((b) => b.id === budgetId);
        const userId = budgetOwner?.user_id;

        const spent =
          userId && spentMap[userId] && spentMap[userId][categoryName]
            ? spentMap[userId][categoryName]
            : 0;

        const category: Category = {
          name: categoryName,
          limit,
          spent,
        };

        if (!budgetCategoryMap[budgetId]) budgetCategoryMap[budgetId] = [];
        budgetCategoryMap[budgetId].push(category);
      }

      const finalBudgets: Budget[] = budgetsData.map((b) => ({
        id: b.id,
        name: b.name,
        amount: b.amount,
        period: b.period,
        categories: budgetCategoryMap[b.id] || [],
        totalSpent: totalSpentMap[b.user_id] || 0,
      }));

      setBudgets(finalBudgets);
      setLoading(false);
    };

    fetchBudgets();
  }, []);

  return { budgets, loading };
};
