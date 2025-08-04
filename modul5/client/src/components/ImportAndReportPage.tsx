import DataImportPage from './DataImportPage';
import ReportGenerator from './ReportGenerator';

const ImportAndReportPage = () => {
  return (
    <div>
      <h2>Veri İçe Aktar (CSV)</h2>
      <DataImportPage />

      <hr style={{ margin: '40px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

      <h2>Özel Rapor Oluşturucu</h2>
      <ReportGenerator />
    </div>
  );
};

export default ImportAndReportPage;