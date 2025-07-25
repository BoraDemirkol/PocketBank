export interface Account {
  id: string; // GUID olacak
  userId: string;
  accountName: string;
  accountType: 'Vadesiz' | 'Vadeli' | 'Kredi Kartı';
  balance: number;
  currency: string;
}
