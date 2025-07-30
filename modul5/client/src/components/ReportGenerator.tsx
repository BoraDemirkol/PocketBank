import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// jsPDF'in autotable özelliğini kullanabilmek için bu tip tanımını ekliyoruz
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Veritabanından gelecek tipleri tanımlayalım
interface Category {
  id: string;
  name: string;
}
interface Account {
  id: string;
  account_name: string;
}

const ReportGenerator = () => {
  // Filtre seçeneklerini doldurmak için kullanılacak listeler
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Kullanıcının seçtiği filtre değerleri
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  
  // Rapor verisini tutmak için yeni state
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Component ilk yüklendiğinde kategorileri ve hesapları çek
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

  // --- GÜNCELLENEN KISIM: Form gönderildiğinde çalışacak fonksiyon ---
  const handleGenerateReport = async (event: React.FormEvent) => {
    event.preventDefault(); // Sayfanın yenilenmesini engelle
    setGeneratingReport(true);
    setReportData([]);

    // Supabase sorgusunu dinamik olarak oluşturalım
    let query = supabase
      .from('transactions')
      .select(`
        id,
        transaction_date, 
        description, 
        amount, 
        categories ( name ), 
        accounts ( account_name )
      `);

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

  // Çoklu seçim listesindeki değişiklikleri yöneten fonksiyon
  const handleMultiSelectChange = (event: React.ChangeEvent<HTMLSelectElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
    setter(selectedOptions);
  };
  
  // Veriyi CSV olarak dışa aktar
  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    const flattenedData = reportData.map(row => ({
      Tarih: row.transaction_date,
      Açıklama: row.description || '',
      Tutar: row.amount,
      Kategori: row.categories?.name || '-',
      Hesap: row.accounts?.account_name || '-',
    }));
    const csv = Papa.unparse(flattenedData);
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'rapor.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Veriyi PDF olarak dışa aktar
  const handleExportPDF = () => {
    if (reportData.length === 0) return;
    const doc = new jsPDF();
    const tableColumn = ["Tarih", "Açıklama", "Tutar", "Kategori", "Hesap"];
    const tableRows: any[] = [];

    reportData.forEach(item => {
      const itemData = [
        item.transaction_date,
        item.description || '',
        item.amount,
        item.categories?.name || '-',
        item.accounts?.account_name || '-',
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.text("İşlem Raporu", 14, 15);
    doc.save("rapor.pdf");
  };

  // Stil tanımlamaları
  const formStyle: React.CSSProperties = { display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '30px' };
  const formGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column' };
  const labelStyle: React.CSSProperties = { marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' };
  const inputStyle: React.CSSProperties = { padding: '8px', border: '1px solid #ccc', borderRadius: '4px' };
  const selectStyle: React.CSSProperties = { ...inputStyle, height: '100px' };
  const buttonStyle: React.CSSProperties = { padding: '10px 20px', border: 'none', borderRadius: '4px', backgroundColor: '#007bff', color: 'white', cursor: 'pointer', height: 'fit-content' };
  const exportButtonStyle: React.CSSProperties = { ...buttonStyle, backgroundColor: '#28a745', marginLeft: '10px' };
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginTop: '20px' };
  const thStyle: React.CSSProperties = { borderBottom: '2px solid #ddd', padding: '12px', textAlign: 'left', backgroundColor: '#f9f9f9' };
  const tdStyle: React.CSSProperties = { borderBottom: '1px solid #eee', padding: '12px' };

  if (loading) {
    return <p>Filtreleme seçenekleri yükleniyor...</p>;
  }

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '30px' }}>
      <h2 style={{ marginBottom: '20px' }}>Özel Rapor Oluşturucu</h2>
      <p style={{color: '#555'}}>
        Belirlediğiniz filtrelere göre özel bir işlem raporu oluşturun ve dışa aktarın.
      </p>
      
      <form onSubmit={handleGenerateReport} style={formStyle}>
        {/* Form elemanları aynı kaldı */}
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
      
      {/* Rapor Ön İzleme ve Dışa Aktarma Bölümü */}
      {reportData.length > 0 && (
        <div>
          <hr style={{margin: '30px 0'}} />
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>Rapor Ön İzlemesi ({reportData.length} işlem bulundu)</h3>
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