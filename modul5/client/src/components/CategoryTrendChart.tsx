import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../supabaseClient';

// Arayüz Tipleri
interface Category {
  id: string;
  name: string;
}
interface MonthlyTrendData {
  month: string;
  total: number;
}

const CategoryTrendChart = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [trendData, setTrendData] = useState<MonthlyTrendData[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Component ilk yüklendiğinde, dropdown için tüm kategorileri çek
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('id, name');
      if (error) {
        console.error('Kategoriler çekilirken hata:', error);
      } else if (data) {
        setCategories(data);
        // İlk kategoriyi otomatik olarak seç
        if (data.length > 0) {
          setSelectedCategory(data[0].id);
        }
      }
    };
    fetchCategories();
  }, []);

  // 2. Seçili kategori her değiştiğinde, o kategoriye ait trend verisini çek
  useEffect(() => {
    if (!selectedCategory) return; // Seçili kategori yoksa bir şey yapma

    const fetchTrendData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, transaction_date')
        .eq('category_id', selectedCategory) // Sadece seçili kategoriye ait işlemleri filtrele
        .lt('amount', 0); // Sadece giderleri al

      if (error) {
        console.error('Trend verisi çekilirken hata:', error);
      } else if (data) {
        const monthlySummary: { [key: string]: number } = {};
        data.forEach((transaction: any) => {
          const date = new Date(transaction.transaction_date);
          const monthName = date.toLocaleString('tr-TR', { month: 'long' });
          const amount = Math.abs(transaction.amount);

          if (monthlySummary[monthName]) {
            monthlySummary[monthName] += amount;
          } else {
            monthlySummary[monthName] = amount;
          }
        });

        const formattedData = Object.keys(monthlySummary).map(month => ({
          month: month,
          total: monthlySummary[month],
        }));
        setTrendData(formattedData);
      }
      setLoading(false);
    };

    fetchTrendData();
  }, [selectedCategory]); // Bu useEffect, selectedCategory değiştiğinde tekrar çalışır

  // Stil tanımlamaları
  const containerStyle: React.CSSProperties = {
    marginTop: '40px',
    padding: '20px',
    border: '1px solid #eee',
    borderRadius: '8px',
  };
  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '16px',
    marginBottom: '20px',
  };

  return (
    <div style={containerStyle}>
      <h3>Kategori Harcama Trendi</h3>
      <select 
        value={selectedCategory} 
        onChange={(e) => setSelectedCategory(e.target.value)}
        style={selectStyle}
      >
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      {loading ? (
        <div>Grafik yükleniyor...</div>
      ) : (
        <ResponsiveContainer width="95%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => `${value.toFixed(2)} TL`} />
            <Legend />
            <Line type="monotone" dataKey="total" name="Aylık Harcama" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default CategoryTrendChart;