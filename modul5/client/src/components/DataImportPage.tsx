import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Papa from 'papaparse';

interface Account {
  id: string;
  account_name: string;
}

const DataImportPage = () => {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [tableHeaders, setTableHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase.from('accounts').select('id, account_name');
      if (error) console.error('Hesaplar çekilirken hata:', error);
      else if (data) setAccounts(data);
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
        if (results.errors.length > 0 || !results.data.length) {
          setError('Dosya okunurken bir hata oluştu. Lütfen dosyanın formatını (Tarih,Aciklama,Tutar) ve içeriğini kontrol edin.');
        } else {
          setTableHeaders(Object.keys(results.data[0] || {}));
          setParsedData(results.data);
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
      const amount = parseFloat(row.Tutar);
      return {
        account_id: selectedAccountId,
        transaction_date: row.Tarih,
        description: row.Aciklama,
        amount: isNaN(amount) ? 0 : amount,
        transaction_type: amount > 0 ? 'income' : 'expense'
      };
    }).filter(t => t.amount !== 0);

    if(transactionsToInsert.length === 0){
        alert("Dosyada geçerli bir işlem satırı bulunamadı.");
        setIsSaving(false);
        return;
    }
    const { error } = await supabase.from('transactions').insert(transactionsToInsert);
    if (error) alert('Veriler kaydedilirken bir hata oluştu: ' + error.message);
    else {
      alert(`${transactionsToInsert.length} işlem başarıyla veritabanına kaydedildi!`);
      setParsedData([]);
      setTableHeaders([]);
      setSelectedAccountId('');
    }
    setIsSaving(false);
  };
  
  // --- YENİ YEŞİL TEMA STİLLERİ ---
  const inputStyle: React.CSSProperties = { padding: '10px', border: '1px solid #00796b', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#e0f2f1', color: '#004d40' };
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '20px', color: 'white' };
  const thStyle: React.CSSProperties = { borderBottom: '2px solid #00796b', padding: '12px', textAlign: 'left', backgroundColor: 'rgba(0, 77, 64, 0.5)', color: '#e0f2f1' };
  const tdStyle: React.CSSProperties = { borderBottom: '1px solid #004d40', padding: '12px' };
  const buttonStyle: React.CSSProperties = { padding: '10px 20px', border: 'none', borderRadius: '8px', backgroundColor: '#00c853', color: 'white', cursor: 'pointer', height: '45px', fontWeight: 'bold' };
  const selectStyle: React.CSSProperties = { padding: '8px', border: '1px solid #00796b', borderRadius: '8px', marginRight: '20px', backgroundColor: '#e0f2f1', color: '#004d40' };
  const labelStyle: React.CSSProperties = {display: 'block', marginBottom: '5px', fontSize: '0.9em', fontWeight: 'bold', color: '#b2dfdb', textAlign: 'left'};
  const actionContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'flex-end', gap: '20px', backgroundColor: 'rgba(0, 77, 64, 0.2)', padding: '20px', borderRadius: '15px' };

  return (
    <div>
      <p style={{color: '#e1bee7', textAlign: 'center'}}>Banka hesap özetinizi CSV formatında yükleyerek işlemlerinizi toplu halde ekleyebilirsiniz.</p>
      
      <div style={{textAlign: 'center', margin: '20px 0'}}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={inputStyle}
        />
      </div>

      {error && <p style={{ color: '#ff8a80', textAlign: 'center' }}>{error}</p>}

      {parsedData.length > 0 && (
        <>
          <h3 style={{color: 'white', textAlign: 'center'}}>Yüklenen Veri Ön İzlemesi</h3>
          <div style={actionContainerStyle}>
            <div>
              <label style={labelStyle}>Hangi Hesaba Aktarılacak?</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                style={{...selectStyle, height: '45px', width: '200px'}}
              >
                <option value="">Lütfen Bir Hesap Seçin</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                ))}
              </select>
            </div>
            <button onClick={handleSaveData} style={buttonStyle} disabled={isSaving}>
              {isSaving ? 'Kaydediliyor...' : 'İçe Aktarmayı Tamamla'}
            </button>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>{tableHeaders.map((header) => <th key={header} style={thStyle}>{header}</th>)}</tr>
            </thead>
            <tbody>
              {parsedData.map((row, rowIndex) => (
                <tr key={rowIndex}>{tableHeaders.map((header) => <td key={header} style={tdStyle}>{row[header]}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default DataImportPage;