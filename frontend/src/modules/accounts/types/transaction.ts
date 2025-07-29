export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  date: string; // ISO string (örn: 2025-07-01T00:00:00Z)
}
