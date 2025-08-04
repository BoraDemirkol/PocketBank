import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Papa from 'papaparse';

interface Account { id: string; account_name: string; }

const DataImportPage = () => {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [tableHeaders, setTableHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error: fetchError } = await supabase.from('accounts').select('id, account_name');
      if (fetchError) {
        console.error('Hesaplar çekilirken hata:', fetchError);
        setError('Hesap listesi yüklenemedi.');
      } else if (data) {
        setAccounts(data);
      }
    };
    fetchAccounts();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParsedData([]);
    setTableHeaders([]);
    setError(null);
    setSelectedAccountId('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 || !results.data.length || !results.meta.fields?.includes('Tutar')) {
          setError('Dosya formatı hatalı. Lütfen dosyanın Tarih, Aciklama, Tutar başlıklarını içerdiğinden emin olun.');
          console.error("CSV okuma hataları:", results.errors);
        } else {
          setTableHeaders(results.meta.fields || []);
          setParsedData(results.data as any[]);
        }
      },
    });
  };

  const handleSaveData = async () => {
    if (!selectedAccountId) {
      alert('Lütfen verilerin hangi hesaba aktarılacağını seçin.');
      return;
    }
    setIsSaving(true);
    const transactionsToInsert = parsedData.map(row => {
      const amount = parseFloat(String(row.Tutar).replace(',', '.'));
      return {
        account_id: selectedAccountId,
        transaction_date: row.Tarih,
        description: row.Aciklama,
        amount: isNaN(amount) ? 0 : amount,
        transaction_type: amount >= 0 ? 'income' : 'expense'
      };
    }).filter(t => t.amount !== 0 && t.transaction_date);

    if (transactionsToInsert.length === 0) {
        alert("Dosyada geçerli bir işlem satırı bulunamadı.");
        setIsSaving(false);
        return;
    }

    const { error: insertError } = await supabase.from('transactions').insert(transactionsToInsert);

    if (insertError) {
      alert('Veriler kaydedilirken bir hata oluştu: ' + insertError.message);
    } else {
      alert(`${transactionsToInsert.length} işlem başarıyla veritabanına kaydedildi!`);
      setParsedData([]);
      setTableHeaders([]);
      setSelectedAccountId('');
    }
    setIsSaving(false);
  };
  
  const actionContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-end', gap: '20px', padding: '20px', backgroundColor: '#fafdf8', borderRadius: '8px', border: '1px solid var(--color-accent, #a5d6a7)' };
  const labelStyle: React.CSSProperties = {display: 'block', marginBottom: '5px', fontSize: '0.9em', fontWeight: 'bold'};
  const selectStyle: React.CSSProperties = { height: '45px', width: '200px' };
  const tableStyle: React.CSSProperties = { width: '100%', marginTop: '20px' };

  return (
    <div className="card">
      <p style={{textAlign: 'center', color: '#555'}}>Banka hesap özetinizi CSV formatında yükleyerek işlemlerinizi toplu halde ekleyebilirsiniz.</p>
      
      <div style={{textAlign: 'center', margin: '20px 0'}}>
        <input type="file" accept=".csv" onChange={handleFileChange} />
      </div>

      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

      {parsedData.length > 0 && (
        <>
          <h3 style={{textAlign: 'center'}}>Yüklenen Veri Ön İzlemesi</h3>
          <div style={actionContainerStyle}>
            <div>
              <label style={labelStyle}>Hangi Hesaba Aktarılacak?</label>
              <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} style={selectStyle}>
                <option value="">Lütfen Bir Hesap Seçin</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_name}</option>)}
              </select>
            </div>
            <button type="button" onClick={handleSaveData} disabled={isSaving}>
              {isSaving ? 'Kaydediliyor...' : 'İşlemleri Onayla ve Ekle'}
            </button>
          </div>

          <table style={tableStyle} className="data-table">
            <thead>
              <tr>{tableHeaders.map((header) => <th key={header}>{header}</th>)}</tr>
            </thead>
            <tbody>
              {parsedData.map((row, rowIndex) => (
                <tr key={rowIndex}>{tableHeaders.map((header) => <td key={header}>{row[header]}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default DataImportPage;