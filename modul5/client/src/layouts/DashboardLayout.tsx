import { useState } from 'react';

// GEREKSİNİM 1: Sayfada gösterilecek tüm bileşenleri import ediyoruz.
import CategoryPieChart from '../components/CategoryPieChart';
import IncomeExpenseChart from '../components/IncomeExpenseChart';
import TopSpendingBarChart from '../components/TopSpendingBarChart';
import ForecastCard from '../components/ForecastCard';
import CategoryAnalysisPage from '../components/CategoryAnalysisPage';
import FinancialHealthScorePage from '../components/FinancialHealthScorePage';
// GEREKSİNİM 2 & 3: Tek sekme altında birleşik bir sayfa göstermek için,
// bu iki özelliği birleştiren ana konteynır sayfasını import ediyoruz.
import ImportAndReportPage from '../components/ImportAndReportPage';

// GEREKSİNİM 1 & 3: Menüdeki tüm sekmeler için tip tanımı.
// 'import' ve 'report' yerine tek bir 'import_export' sekmesi var.
type Tab = 'dashboard' | 'category' | 'trends' | 'health' | 'import_export';

const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Sekmelerin stilini yöneten fonksiyon.
  const tabStyle = (tabName: Tab) => ({
    padding: '12px 20px',
    marginRight: '10px',
    border: 'none',
    borderBottom: activeTab === tabName ? '3px solid #007bff' : '3px solid transparent',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    color: activeTab === tabName ? '#007bff' : '#555',
    fontSize: '16px',
    transition: 'all 0.2s ease-in-out',
  });

  return (
    <div style={{ padding: '20px 40px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* --- DEĞİŞTİRİLEN BÖLÜM BURASI --- */}
      <header style={{ marginBottom: '20px' }}>
        <h1
          style={{
            fontSize: '2em',
            cursor: 'pointer', // Mouse imlecini tıklanabilir el işareti yapar
            display: 'inline-block', // Butonun tüm satırı kaplamasını engeller
            padding: '5px 10px',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onClick={() => setActiveTab('dashboard')} // Tıklandığında 'Dashboard' sekmesini aktif eder
          title="Modül 5 Ana Sayfasına Dön" // Mouse ile üzerine gelince ipucu gösterir
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')} // Üzerine gelince arkaplan rengini değiştirir
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')} // Üzerinden çekilince eski haline döner
        >
          Modül 5 - Analitik Raporlama
        </h1>
      </header>
      
      {/* GEREKSİNİM 1: Sayfanın en üstündeki navigasyon menüsü */}
      <nav style={{ marginBottom: '30px', borderBottom: '1px solid #ddd' }}>
        <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </button>
        <button style={tabStyle('category')} onClick={() => setActiveTab('category')}>
          Harcama Analizi
        </button>
        <button style={tabStyle('trends')} onClick={() => setActiveTab('trends')}>
          Gelir-Gider Trendi
        </button>
        <button style={tabStyle('health')} onClick={() => setActiveTab('health')}>
          Finansal Sağlık Skoru
        </button>
        {/* GEREKSİNİM 3: İki eski düğmenin yerine gelen tek bir birleşik düğme. */}
        <button style={tabStyle('import_export')} onClick={() => setActiveTab('import_export')}>
          İçe/Dışa Aktar
        </button>
      </nav>

      <main>
        {/* Her sekme tıklandığında hangi bileşenin gösterileceğini belirleyen kurallar */}
        
        {activeTab === 'dashboard' && (
          <div>
            <h2>Dashboard</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
              <CategoryPieChart />
              <TopSpendingBarChart />
              <IncomeExpenseChart />
            </div>
          </div>
        )}

        {activeTab === 'category' && (
          <CategoryAnalysisPage />
        )}
        
        {activeTab === 'trends' && (
              <div>
                <h2>Aylık Gelir - Gider Trendi</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                  <IncomeExpenseChart />
                  <ForecastCard />
                </div>
              </div>
        )}

        {activeTab === 'health' && (
          <div>
            <h2>Finansal Sağlık Skoru</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}> 
              <FinancialHealthScorePage /> 
            </div>
          </div>
        )}

        {/* GEREKSİNİM 2: Tek sekmeye basıldığında, iki özelliği de içeren ana sayfa gösteriliyor. */}
        {activeTab === 'import_export' && <ImportAndReportPage />}
        
      </main>
    </div>
  );
};

export default DashboardLayout;