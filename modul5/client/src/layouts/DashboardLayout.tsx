import { useState } from 'react';
import CategoryPieChart from '../components/CategoryPieChart';
import IncomeExpenseChart from '../components/IncomeExpenseChart';
import TopSpendingBarChart from '../components/TopSpendingBarChart'; // YENİ IMPORT

// Yeni sekmelerimizi tanımlıyoruz
type Tab = 'dashboard' | 'category' | 'trends' | 'health' | 'import';

const DashboardLayout = () => {
  // Başlangıç sekmemiz 'dashboard' olacak
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  // Butonlar için stil tanımlamaları
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
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '2em' }}>Modül 5 - Analitik Raporlama</h1>
      </header>

      {/* Yeni Sekme Navigasyonu */}
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
         <button style={tabStyle('import')} onClick={() => setActiveTab('import')}>
          İçe Aktar
        </button>
      </nav>

      {/* Aktif Sekmeye Göre İçeriği Gösterme */}
      <main>
        {activeTab === 'dashboard' && (
          <div>
            <h2>Dashboard</h2>
            {/* YENİ GRAFİK BURAYA EKLENDİ */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
              <CategoryPieChart />
              <TopSpendingBarChart />
              <IncomeExpenseChart />
            </div>
          </div>
        )}

        {activeTab === 'category' && (
          <div>
            <h2>Harcama Analizi İçeriği</h2>
            {/* Buraya kategori tablosu gelecek */}
          </div>
        )}
        
        {activeTab === 'trends' && (
             <div>
                <h2>Aylık Gelir - Gider Trendi</h2>
                <IncomeExpenseChart />
             </div>
        )}

        {activeTab === 'health' && (
          <div>
            <h2>Finansal Sağlık Skoru</h2>
            {/* Buraya sağlık skoru bileşeni gelecek */}
          </div>
        )}

         {activeTab === 'import' && (
          <div>
            <h2>Veri İçe Aktar</h2>
            {/* Buraya import bileşeni gelecek */}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardLayout;