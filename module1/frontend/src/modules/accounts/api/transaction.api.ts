import { apiService } from "../../../api";
import type { Transaction } from "../types/transaction";

export const fetchTransactions = async (accountId: string) => {
  const res = await apiService.get(`/account/${accountId}/transaction`);
  return res;
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
  const res = await apiService.get(`/account/${accountId}/transaction/statement?start=${startDate}&end=${endDate}`);

  return res.map((dto: TransactionDto) => ({
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
  try {
    const headers = await apiService.getAuthHeaders();
    const response = await fetch(`/account/${accountId}/transaction/extractPdf?start=${start}&end=${end}`, {
      method: 'GET',
      headers: {
        ...headers,
        'Accept': 'application/pdf'
      }
    });

    if (!response.ok) {
      throw new Error(`PDF download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ekstre-${start}_to_${end}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download PDF:', error);
    throw error;
  }
};
