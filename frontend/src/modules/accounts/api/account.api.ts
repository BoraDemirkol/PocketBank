import api from "../../../Shared/api/axios";
import { Account } from "../types/account";

export const fetchAccounts = async (): Promise<Account[]> => {
  const res = await api.get("/account");
  return res.data;
};

export const createAccount = async (account: Omit<Account, "id">) => {
  const res = await api.post("/account", account);
  return res.data;
};