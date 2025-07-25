import { supabase } from '../Shared/supabaseClient';
import jsPDF from 'jspdf';

export const fetchTransactionsByAccount = async (accountId: string) => {
    return await supabase
        .from('transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('transaction_date', { ascending: false });
};

export const generateAccountStatementPDF = (transactions: any[], accountId: string) => {
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
