import React, { useEffect, useState } from "react";
import { fetchTransactions } from "../api/transaction.api";
import { Transaction } from "../types/transaction";

interface Props {
  accountId: string;
  onClose: () => void;
}

const TransactionModal: React.FC<Props> = ({ accountId, onClose }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchTransactions(accountId).then((result) => {
      setTransactions(result);
    });
  }, [accountId]);

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>İşlem Geçmişi</h2>
        <ul>
          {transactions.map((tx, index) => (
            <li key={index}>
              {new Date(tx.date).toLocaleDateString()} - {tx.description} - {tx.amount.toFixed(2)} ₺
            </li>
          ))}
        </ul>
        <button onClick={onClose}>Kapat</button>
      </div>
    </div>
  );
};

export default TransactionModal;
