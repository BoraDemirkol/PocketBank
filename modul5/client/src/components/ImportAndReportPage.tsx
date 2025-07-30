
import DataImportPage from './DataImportPage';
import ReportGenerator from './ReportGenerator';

const ImportAndReportPage = () => {
  return (
    <div>
      {/* --- İçe Aktarma Bölümü --- */}
      <DataImportPage />

      {/* İki bölüm arasına görsel bir ayırıcı koyalım */}
      <hr style={{ margin: '60px 0', border: 'none', borderTop: '2px solid #f0f0f0' }} />

      {/* --- Rapor Oluşturucu Bölümü --- */}
      <ReportGenerator />
    </div>
  );
};

export default ImportAndReportPage;