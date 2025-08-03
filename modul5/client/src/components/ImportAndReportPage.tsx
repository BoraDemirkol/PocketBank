import React from 'react';
import DataImportPage from './DataImportPage';
import ReportGenerator from './ReportGenerator';

const ImportAndReportPage = () => {
  
  // Ana sayfa stili (mor arka plan)
  const pageStyle: React.CSSProperties = {
    backgroundColor: '#4a148c', // Koyu mor ana arkaplan
    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`,
    backgroundSize: '20px 20px',
    padding: '40px',
    borderRadius: '25px',
    color: '#fff', // Genel metin rengi beyaz
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  };

  // Her bir bölüm (İçe Aktar, Rapor Oluşturucu) için yeşil arka plan stili
  const sectionContainerStyle: React.CSSProperties = {
    backgroundColor: 'rgba(0, 100, 0, 0.1)', // Yeşilimsi, hafif şeffaf arka plan
    padding: '20px',
    borderRadius: '15px',
    border: '1px solid #00796b' // Koyu yeşil kenarlık
  };

  // Her bir bölüm için başlık stili
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.5em',
    color: '#b2dfdb', // Açık yeşil/turkuaz
    borderBottom: '2px solid #00796b',
    paddingBottom: '10px',
    marginBottom: '20px',
    textAlign: 'center'
  };

  // İki bölümü ayıran çizgi için stil
  const separatorStyle: React.CSSProperties = {
    margin: '60px 0',
    border: 'none',
    borderTop: '2px solid #7b1fa2' // Orta ton mor
  };

  return (
    <div style={pageStyle}>
      
      {/* --- İçe Aktarma Bölümü --- */}
      <div style={sectionContainerStyle}>
        <h2 style={sectionTitleStyle}>Veri İçe Aktar (CSV)</h2>
        <DataImportPage />
      </div>

      {/* --- Ayırıcı Çizgi --- */}
      <hr style={separatorStyle} />

      {/* --- Rapor Oluşturucu Bölümü --- */}
      <div style={sectionContainerStyle}>
        <h2 style={sectionTitleStyle}>Özel Rapor Oluşturucu</h2>
        <ReportGenerator />
      </div>

    </div>
  );
};

export default ImportAndReportPage;