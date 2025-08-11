import api from "../../../Shared/api/axios";
import type { Account } from "../types/account";

export const fetchAccounts = async (): Promise<Account[]> => {
  const res = await api.get("/account");
  return res.data;
};

export const createAccount = async (account: Omit<Account, "id">) => {
  const res = await api.post("/account", account);
  return res.data;
};

export const fetchBalance = async (
  accountId: string,
  currency: string = "USD"
): Promise<{
  accountId: string;
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
}> => {
  const res = await api.get("/transactions/balance", {
    params: { accountId, currency },
  });
  return res.data;
};
