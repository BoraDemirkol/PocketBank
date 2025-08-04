import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Kütüphaneyi doğrudan fonksiyon olarak import ediyoruz

// Veritabanından gelecek tipleri tanımlıyoruz
interface Category {
  id: string;
  name: string;
}
interface Account {
  id: string;
  account_name: string;
}

const ReportGenerator = () => {
  // State'ler
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Filtre verilerini çekme
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

  // Rapor oluşturma
  const handleGenerateReport = async (event: React.FormEvent) => {
    event.preventDefault();
    setGeneratingReport(true);
    setReportData([]);
    let query = supabase
      .from('transactions')
      .select(`id, transaction_date, description, amount, categories ( name ), accounts ( account_name )`);
    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);
    if (selectedCategories.length > 0) query = query.in('category_id', selectedCategories);
    if (selectedAccounts.length > 0) query = query.in('account_id', selectedAccounts);
    const { data, error } = await query;
    if (error) {
      alert('Rapor verisi çekilirken hata oluştu: ' + error.message);
    } else if (data && data.length > 0) {
      setReportData(data);
    } else {
      alert('Seçili filtrelere uygun hiçbir işlem bulunamadı.');
    }
    setGeneratingReport(false);
  };

  const handleMultiSelectChange = (event: React.ChangeEvent<HTMLSelectElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
    setter(selectedOptions);
  };
  
  // CSV Dışa Aktarma Fonksiyonu
  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    const flattenedData = reportData.map(row => ({
      Tarih: String(row.transaction_date || '-'),
      Açıklama: String(row.description || ''),
      Tutar: String(row.amount || '0'),
      Kategori: String(row.categories?.name || '-'),
      Hesap: String(row.accounts?.account_name || '-'),
    }));
    const csv = Papa.unparse(flattenedData);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'rapor.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Dışa Aktarma Fonksiyonu (Düzeltilmiş Hali)
  const handleExportPDF = () => {
    if (reportData.length === 0) return;
    try {
      const doc = new jsPDF();
      const tableColumn = ["Tarih", "Açıklama", "Tutar", "Kategori", "Hesap"];
      const tableRows: string[][] = [];

      reportData.forEach(item => {
        const itemData = [
          String(item.transaction_date || '-'),
          String(item.description || '-'),
          String(item.amount || '0'), 
          String(item.categories?.name || '-'),
          String(item.accounts?.account_name || '-'),
        ];
        tableRows.push(itemData);
      });

      doc.text("İşlem Raporu", 14, 15);
      
      // autoTable fonksiyonunu doğrudan çağırıyoruz. Bu en güvenilir yöntemdir.
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });

      doc.save("rapor.pdf");

    } catch (e) {
      console.error("PDF oluşturulurken hata:", e);
      alert("PDF oluşturulurken beklenmedik bir hata oluştu. Lütfen konsolu kontrol edin.");
    }
  };

  // Stil Tanımlamaları
  const formStyle: React.CSSProperties = { display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'center', padding: '20px' };
  const formGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', minWidth: '150px' };
  const labelStyle: React.CSSProperties = { marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' };
  const selectStyle: React.CSSProperties = { height: '120px' };
  const tableContainerStyle: React.CSSProperties = { marginTop: '30px' };

  if (loading) return <p>Filtreleme seçenekleri yükleniyor...</p>;

  return (
    <div className="card"> 
      <p style={{textAlign: 'center'}}>Belirlediğiniz filtrelere göre özel bir işlem raporu oluşturun ve dışa aktarın.</p>
      <form onSubmit={handleGenerateReport} style={formStyle}>
          <div style={formGroupStyle}>
            <label htmlFor="startDate" style={labelStyle}>Başlangıç Tarihi:</label>
            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div style={formGroupStyle}>
            <label htmlFor="endDate" style={labelStyle}>Bitiş Tarihi:</label>
            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} />
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
          <button type="submit" disabled={generatingReport}>
            {generatingReport ? 'Oluşturuluyor...' : 'Rapor Oluştur'}
          </button>
      </form>
      
      {reportData.length > 0 && (
        <div style={tableContainerStyle}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>Rapor Ön İzlemesi ({reportData.length} işlem bulundu)</h3>
            <div>
              <button onClick={handleExportCSV}>CSV Olarak İndir</button>
              <button onClick={handleExportPDF} style={{marginLeft: '10px'}}>PDF Olarak İndir</button>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Tarih</th><th>Açıklama</th><th>Tutar</th><th>Kategori</th><th>Hesap</th></tr>
            </thead>
            <tbody>
              {reportData.map((row) => (
                <tr key={row.id}>
                  <td>{row.transaction_date}</td>
                  <td>{row.description}</td>
                  <td>{row.amount}</td>
                  <td>{row.categories?.name || '-'}</td>
                  <td>{row.accounts?.account_name || '-'}</td>
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