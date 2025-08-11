import api from "../../../Shared/api/axios";
import type { Transaction } from "../types/transaction";

export const fetchTransactions = async (accountId: string) => {
  const res = await api.get(`/account/${accountId}/transaction`);
  return res.data;
};

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
    id: "", 
    accountId,
    ...dto,
  }));
};

export const downloadStatementPdf = async (
  accountId: string,
  start: string,
  end: string
) => {
  const res = await api.get(`/account/${accountId}/transaction/extractPdf`, {
    params: { start, end },
    responseType: "blob"
  });

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `ekstre-${start}_to_${end}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
