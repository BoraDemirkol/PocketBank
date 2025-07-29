import api from "../../../Shared/api/axios";
import { Transaction } from "../types/transaction";

// Yeni backend endpoint ile uyumlu hale getiriyoruz
export const fetchTransactions = async (accountId: string): Promise<Transaction[]> => {
  const res = await api.get(`/transactions`, {
    params: { accountId }
  });
  return res.data;
};


// 🔹 2. Yeni Ekstre API (PDF özet ve filtreli listeleme için)
export interface TransactionDto {
  date: string;
  amount: number;
  description: string;
}

export const fetchExtractTransactions = async (
  accountId: string,
  startDate?: string,
  endDate?: string
): Promise<Transaction[]> => {
  const res = await api.get<TransactionDto[]>(`/transactions/extract`, {
    params: { accountId, startDate, endDate },
  });

  return res.data.map((dto) => ({
    id: "", // DTO'da gelmiyor
    accountId,
    ...dto,
  }));
};
