import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import 'jspdf-autotable';


interface Category { id: string; name: string; }
interface Account { id: string; account_name: string; }

const ReportGenerator = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    const fetchDataForFilters = async () => {
      const { data: categoriesData } = await supabase.from('categories').select('id, name');
      setCategories(categoriesData || []);
      const { data: accountsData } = await supabase.from('accounts').select('id, account_name');
      setAccounts(accountsData || []);
      setLoading(false);
    };
    fetchDataForFilters();
  }, []);

  const handleGenerateReport = async (event: React.FormEvent) => {
    event.preventDefault();
    setGeneratingReport(true);
    setReportData([]);
    let query = supabase.from('transactions').select(`id, transaction_date, description, amount, categories ( name ), accounts ( account_name )`);
    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);
    if (selectedCategories.length > 0) query = query.in('category_id', selectedCategories);
    if (selectedAccounts.length > 0) query = query.in('account_id', selectedAccounts);
    const { data, error } = await query;
    if (error) alert('Rapor verisi çekilirken hata oluştu: ' + error.message);
    else if (data && data.length > 0) setReportData(data);
    else alert('Seçili filtrelere uygun hiçbir işlem bulunamadı.');
    setGeneratingReport(false);
  };

  const handleMultiSelectChange = (event: React.ChangeEvent<HTMLSelectElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
    setter(selectedOptions);
  };
  
  const handleExportCSV = () => { /* ... (Bu fonksiyonlar aynı kalabilir) ... */ };
  const handleExportPDF = () => { /* ... (Bu fonksiyonlar aynı kalabilir) ... */ };

  // --- YENİ YEŞİL TEMA STİLLERİ ---
  const formContainerStyle: React.CSSProperties = { backgroundColor: 'rgba(0, 77, 64, 0.2)', padding: '20px', borderRadius: '15px', border: '1px solid #004d40' };
  const formStyle: React.CSSProperties = { display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'center' };
  const formGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
  const labelStyle: React.CSSProperties = { marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em', color: '#b2dfdb' }; 
  const inputStyle: React.CSSProperties = { padding: '8px', border: '1px solid #00796b', borderRadius: '8px', backgroundColor: '#e0f2f1', color: '#004d40' };
  const selectStyle: React.CSSProperties = { ...inputStyle, height: '100px' };
  const buttonStyle: React.CSSProperties = { padding: '10px 20px', border: 'none', borderRadius: '8px', backgroundColor: '#00c853', color: 'white', cursor: 'pointer', height: 'fit-content', fontWeight: 'bold' };
  const exportButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: '#64dd17', marginLeft: '10px' };
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '20px', color: 'white' };
  const thStyle: React.CSSProperties = { borderBottom: '2px solid #00796b', padding: '12px', textAlign: 'left', backgroundColor: 'rgba(0, 77, 64, 0.5)', color: '#e0f2f1' };
  const tdStyle: React.CSSProperties = { borderBottom: '1px solid #004d40', padding: '12px' };

  if (loading) {
    return <p style={{color: 'white', textAlign: 'center'}}>Filtreleme seçenekleri yükleniyor...</p>;
  }

  return (
    <div>
      <p style={{color: '#e1bee7', textAlign: 'center'}}>Belirlediğiniz filtrelere göre özel bir işlem raporu oluşturun ve dışa aktarın.</p>
      <div style={formContainerStyle}>
        <form onSubmit={handleGenerateReport} style={formStyle}>
          <div style={formGroupStyle}>
            <label htmlFor="startDate" style={labelStyle}>Başlangıç Tarihi:</label>
            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
          </div>
          <div style={formGroupStyle}>
            <label htmlFor="endDate" style={labelStyle}>Bitiş Tarihi:</label>
            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
          </div>
          <div style={formGroupStyle}>
            <label htmlFor="categories" style={labelStyle}>Kategoriler:</label>
            <select multiple id="categories" value={selectedCategories} onChange={e => handleMultiSelectChange(e, setSelectedCategories)} style={selectStyle}>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div style={formGroupStyle}>
            <label htmlFor="accounts" style={labelStyle}>Hesaplar:</label>
            <select multiple id="accounts" value={selectedAccounts} onChange={e => handleMultiSelectChange(e, setSelectedAccounts)} style={selectStyle}>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.account_name}</option>)}
            </select>
          </div>
          <button type="submit" style={buttonStyle} disabled={generatingReport}>
            {generatingReport ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
          </button>
        </form>
      </div>
      
      {reportData.length > 0 && (
        <div>
          <hr style={{margin: '30px 0', border: 'none', borderTop: '1px solid #004d40'}} />
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 style={{color: 'white'}}>Rapor Ön İzlemesi ({reportData.length} işlem bulundu)</h3>
            <div>
              <button onClick={handleExportCSV} style={exportButtonStyle}>CSV Olarak İndir</button>
              <button onClick={handleExportPDF} style={exportButtonStyle}>PDF Olarak İndir</button>
            </div>
          </div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Tarih</th>
                <th style={thStyle}>Açıklama</th>
                <th style={thStyle}>Tutar</th>
                <th style={thStyle}>Kategori</th>
                <th style={thStyle}>Hesap</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row) => (
                <tr key={row.id}>
                  <td style={tdStyle}>{row.transaction_date}</td>
                  <td style={tdStyle}>{row.description}</td>
                  <td style={tdStyle}>{row.amount}</td>
                  <td style={tdStyle}>{row.categories?.name || '-'}</td>
                  <td style={tdStyle}>{row.accounts?.account_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportGenerator;