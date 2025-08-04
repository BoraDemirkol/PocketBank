import { useState } from 'react';
import Header from '../components/Header';
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
    padding: '12px 20px',
    marginRight: '10px',
    border: 'none',
    borderBottom: activeTab === tabName ? '3px solid #114b01ff' : '3px solid transparent',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    color: activeTab === tabName ? '#176402ff' : '#555',
    fontSize: '16px',
    transition: 'all 0.2s ease-in-out',
  });

  const contentContainerStyle: React.CSSProperties = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px',
  };
  
  return (
    <div>
      <Header />

      <div style={contentContainerStyle}>
        <nav style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid #ddd', marginBottom: '30px' }}>
          <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button style={tabStyle('category')} onClick={() => setActiveTab('category')}>Harcama Analizi</button>
          <button style={tabStyle('trends')} onClick={() => setActiveTab('trends')}>Gelir-Gider Trendi</button>
          <button style={tabStyle('health')} onClick={() => setActiveTab('health')}>Finansal Sağlık Skoru</button>
          <button style={tabStyle('import_export')} onClick={() => setActiveTab('import_export')}>İçe/Dışa Aktar</button>
        </nav>

        <main>
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ textAlign: 'center' }}>Dashboard</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 500px', minWidth: '400px', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
                  <h3 style={{ textAlign: 'center' }}>Kategori Dağılımı</h3>
                  <CategoryPieChart />
                </div>
                <div style={{ flex: '1 1 500px', minWidth: '400px', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
                  <h3 style={{ textAlign: 'center' }}>En Çok Harcananlar</h3>
                  <TopSpendingBarChart />
                </div>
                <div style={{ flex: '1 1 100%', marginTop: '20px', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
                  <h3 style={{ textAlign: 'center' }}>Gelir-Gider Genel Bakış</h3>
                  <IncomeExpenseChart />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'category' && <CategoryAnalysisPage />}
          
          {activeTab === 'trends' && (
              <div>
                  <h2 style={{ textAlign: 'center' }}>Aylık Gelir - Gider Trendi</h2>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '2 1 600px', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
                      <IncomeExpenseChart />
                    </div>
                    <div style={{ flex: '1 1 300px', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
                      <ForecastCard />
                    </div>
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