import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Fonksiyondan dönecek verinin tipini tanımlayalım
interface CategoryAnalysisData {
  category_name: string;
  total_spending: number;
  transaction_count: number;
  average_spending: number;
}

const CategoryAnalysisTable = () => {
  const [analysisData, setAnalysisData] = useState<CategoryAnalysisData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      // Supabase'deki veritabanı fonksiyonumuzu çağırıyoruz
      const { data, error } = await supabase.rpc('get_category_spending_analysis');

      if (error) {
        console.error('Analiz verisi çekerken hata:', error);
      } else {
        setAnalysisData(data);
      }
      setLoading(false);
    };

    fetchAnalysisData();
  }, []);

  if (loading) {
    return <div>Analiz tablosu yükleniyor...</div>;
  }

  // Stil tanımlamaları
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  };
  const thStyle: React.CSSProperties = {
    borderBottom: '2px solid #ddd',
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f9f9f9',
  };
  const tdStyle: React.CSSProperties = {
    borderBottom: '1px solid #eee',
    padding: '12px',
  };

  return (
    <div>
      <h3>Kategori Harcama Özeti</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Kategori Adı</th>
            <th style={thStyle}>Toplam Harcama</th>
            <th style={thStyle}>İşlem Adedi</th>
            <th style={thStyle}>Ortalama Harcama / İşlem</th>
          </tr>
        </thead>
        <tbody>
          {analysisData.map((row) => (
            <tr key={row.category_name}>
              <td style={tdStyle}>{row.category_name}</td>
              <td style={tdStyle}>{row.total_spending.toFixed(2)} TL</td>
              <td style={tdStyle}>{row.transaction_count}</td>
              <td style={tdStyle}>{row.average_spending.toFixed(2)} TL</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoryAnalysisTable;