import { useState } from 'react';
import CategoryPieChart from '../components/CategoryPieChart';
import IncomeExpenseChart from '../components/IncomeExpenseChart';
import TopSpendingBarChart from '../components/TopSpendingBarChart';
import ForecastCard from '../components/ForecastCard';
import CategoryAnalysisPage from '../components/CategoryAnalysisPage';
import FinancialHealthScorePage from '../components/FinancialHealthScorePage';
import ImportAndReportPage from '../components/ImportAndReportPage';

type Tab = 'dashboard' | 'category' | 'trends' | 'health' | 'import_export';

const DashboardLayout = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const tabStyle = (tabName: Tab): React.CSSProperties => ({
    padding: '16px 20px',
    border: 'none',
    borderBottom: activeTab === tabName ? '3px solid var(--color-primary, #2e7d32)' : '3px solid transparent',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    color: activeTab === tabName ? 'var(--color-text-primary, #1b5e20)' : 'var(--color-text-secondary, #4caf50)',
    fontSize: '16px',
    transition: 'all 0.2s ease-in-out',
  });

  const dashboardGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    alignItems: 'center'
  };

  return (
    // Ana kapsayıcının kenar boşluklarını kaldırdık
    <div>
      
      {/* Başlık ve ana içerik için ortalanmış bir alan */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <header style={{ paddingTop: '20px', marginBottom: '20px', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '2em',
              cursor: 'pointer',
              display: 'inline-block'
            }}
            onClick={() => setActiveTab('dashboard')}
            title="Modül 5 Ana Sayfasına Dön"
          >
            Modül 5 - Analitik Raporlama
          </h1>
        </header>
      </div>

      {/* --- İSTEDİĞİN TAM GENİŞLİKLİ MENÜ ŞERİDİ BURASI --- */}
      <div style={{ 
          width: '100%', 
          backgroundColor: 'var(--color-surface, white)', // Beyaz şerit arka planı
          borderBottom: '1px solid var(--color-accent, #e8f5e9)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <nav style={{ 
            maxWidth: '1200px', // Butonların hizalanacağı maksimum genişlik
            margin: '0 auto',   // Butonları sayfanın ortasına hizalar
            display: 'flex', 
            justifyContent: 'flex-start', // Butonları soldan başlatır
        }}>
          <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button style={tabStyle('category')} onClick={() => setActiveTab('category')}>Harcama Analizi</button>
          <button style={tabStyle('trends')} onClick={() => setActiveTab('trends')}>Gelir-Gider Trendi</button>
          <button style={tabStyle('health')} onClick={() => setActiveTab('health')}>Finansal Sağlık Skoru</button>
          <button style={tabStyle('import_export')} onClick={() => setActiveTab('import_export')}>İçe/Dışa Aktar</button>
        </nav>
      </div>

      {/* Ana sayfa içeriği, yine ortalanmış bir alanda devam ediyor */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <main>
          {activeTab === 'dashboard' && (
            <div>
              <h2>Dashboard</h2>
              <div style={dashboardGridStyle}>
                <CategoryPieChart />
                <TopSpendingBarChart />
                <IncomeExpenseChart />
              </div>
            </div>
          )}

          {activeTab === 'category' && <CategoryAnalysisPage />}
          {activeTab === 'trends' && (
            <div>
              <h2>Aylık Gelir - Gider Trendi</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                <IncomeExpenseChart />
                <ForecastCard />
              </div>
            </div>
          )}
          {activeTab === 'health' && <FinancialHealthScorePage />}
          {activeTab === 'import_export' && <ImportAndReportPage />}
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;