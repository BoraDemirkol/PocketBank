
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Papa from 'papaparse';

// Veritabanından gelecek hesap tipini tanımlayalım
interface Account {
  id: string;
  account_name: string;
}

const DataImportPage = () => {
  // Yüklenen dosyadaki veriyi ve başlıkları tutmak için state'ler
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [tableHeaders, setTableHeaders] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Component ilk yüklendiğinde, hesap seçimi menüsünü doldurmak için hesapları çek
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase.from('accounts').select('id, account_name');
      if (error) {
        console.error('Hesaplar çekilirken hata:', error);
      } else if (data) {
        setAccounts(data);
      }
    };
    fetchAccounts();
  }, []);

  // Dosya seçildiğinde çalışacak olan fonksiyon
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Yeni dosya seçildiğinde eski verileri temizle
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
          console.error("CSV okuma hataları:", results.errors);
        } else {
          setTableHeaders(Object.keys(results.data[0] || {}));
          setParsedData(results.data);
        }
      },
    });
  };

  // Veri kaydetme fonksiyonu
  const handleSaveData = async () => {
    if (parsedData.length === 0) {
      alert('Kaydedilecek veri bulunmuyor.');
      return;
    }
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

    if (error) {
      alert('Veriler kaydedilirken bir hata oluştu: ' + error.message);
    } else {
      alert(`${transactionsToInsert.length} işlem başarıyla veritabanına kaydedildi!`);
      setParsedData([]);
      setTableHeaders([]);
      setSelectedAccountId('');
    }
    setIsSaving(false);
  };
  
  // Stil tanımlamaları
  const inputStyle: React.CSSProperties = { padding: '10px', border: '1px solid #ccc', borderRadius: '5px', marginBottom: '20px' };
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '20px' };
  const thStyle: React.CSSProperties = { borderBottom: '2px solid #ddd', padding: '12px', textAlign: 'left', backgroundColor: '#f9f9f9' };
  const tdStyle: React.CSSProperties = { borderBottom: '1px solid #eee', padding: '12px' };
  const buttonStyle: React.CSSProperties = { padding: '10px 20px', border: 'none', borderRadius: '4px', backgroundColor: '#28a745', color: 'white', cursor: 'pointer', height: '45px' };
  const selectStyle: React.CSSProperties = { padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginRight: '20px' };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Toplu İşlem İçe Aktarma (CSV)</h2>
      <p>Banka hesap özetinizi CSV formatında yükleyerek işlemlerinizi toplu halde ekleyebilirsiniz.</p>
      
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={inputStyle}
      />

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {parsedData.length > 0 && (
        <>
          <h3>Yüklenen Veri Ön İzlemesi</h3>
          
          {/* --- BURASI ASİMETRİ İÇİN DÜZELTİLDİ --- */}
          <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', // Öğeleri alta hizalar
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px',
              gap: '20px' // Araya boşluk ekler
          }}>
            <div>
              <label style={{display: 'block', marginBottom: '5px', fontSize: '0.9em', fontWeight: 'bold'}}>Hangi Hesaba Aktarılacak?</label>
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
              <tr>
                {tableHeaders.map((header) => <th key={header} style={thStyle}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {parsedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {tableHeaders.map((header) => <td key={header} style={tdStyle}>{row[header]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default DataImportPage;