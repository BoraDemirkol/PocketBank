import './App.css';
import CategoryPieChart from './components/CategoryPieChart';
import IncomeExpenseChart from './components/IncomeExpenseChart'; // <-- BU SATIRI EKLE

function App() {
  return (
    <div>
      <h1>Modül 5 - Analitik Raporlama</h1>

      <h2>Harcama Kategorileri Dağılımı</h2>
      <CategoryPieChart />

      <hr style={{ margin: '40px 0' }} /> 

      <h2>Aylık Gelir - Gider Trendi</h2>
      <IncomeExpenseChart /> 
    </div>
  );
}

export default App;