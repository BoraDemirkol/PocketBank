import axios from 'axios';
import jsPDF from 'jspdf';
import { Transaction } from '../types';

export const fetchTransactionsByAccount = async (accountId: string) => {
    try {
        const response = await axios.get(`/api/transaction?accountId=${accountId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
};

export const generateAccountStatementPDF = (transactions: Transaction[], accountId: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Hesap Ekstresi', 20, 20);
    doc.setFontSize(12);

    let y = 30;
    transactions.forEach((tx, i) => {
        doc.text(
            `${i + 1}. ${tx.transaction_date} - ${tx.description} - ${tx.amount.toLocaleString('tr-TR')} ₺`,
            20,
            y
        );
        y += 10;
    });

    doc.save(`hesap-ekstresi-${accountId}.pdf`);
};
