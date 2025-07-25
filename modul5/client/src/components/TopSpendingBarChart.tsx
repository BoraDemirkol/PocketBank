import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../supabaseClient';

// Veri formatımızı tanımlayalım
interface BarChartData {
  name: string;
  total: number;
}

const TopSpendingBarChart = () => {
  const [chartData, setChartData] = useState<BarChartData[]>([]);

  useEffect(() => {
    const fetchTopSpendingCategories = async () => {
      // Bu sefer Supabase'den RPC (veritabanı fonksiyonu) ile veri çekeceğiz.
      // Bu, veriyi daha verimli işlememizi sağlar. Önce fonksiyonu oluşturmalıyız.
      // ŞİMDİLİK GEÇİCİ OLARAK AYNI YÖNTEMLE VERİYİ ÇEKELİM:
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          amount,
          categories ( name )
        `);

      if (error) {
        console.error('Bar grafik için veri çekerken hata:', error);
        return;
      }

      if (transactions) {
        const spendingByCategory: { [key: string]: number } = {};

        transactions.forEach((transaction: any) => {
          if (transaction.amount < 0) {
            const categoryName = transaction.categories?.name || 'Diğer';
            const amount = Math.abs(transaction.amount);

            if (spendingByCategory[categoryName]) {
              spendingByCategory[categoryName] += amount;
            } else {
              spendingByCategory[categoryName] = amount;
            }
          }
        });

        // Hesaplanan veriyi Recharts'ın istediği formata dönüştür, sırala ve ilk 5'i al
        const formattedAndSortedData = Object.keys(spendingByCategory)
          .map((key) => ({
            name: key,
            total: spendingByCategory[key],
          }))
          .sort((a, b) => b.total - a.total) // En yüksekten düşüğe sırala
          .slice(0, 5); // İlk 5'i al

        setChartData(formattedAndSortedData);
      }
    };

    fetchTopSpendingCategories();
  }, []);

  if (chartData.length === 0) {
    return <div>Bar grafik verisi yükleniyor...</div>;
  }

  return (
    <ResponsiveContainer width="95%" height={400}>
      <BarChart
        data={chartData}
        layout="vertical" // Grafiği yatay yapalım, daha okunaklı olur
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={80} />
        <Tooltip formatter={(value: number) => `${value.toFixed(2)} TL`} />
        <Legend />
        <Bar dataKey="total" fill="#8884d8" name="Toplam Harcama" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TopSpendingBarChart;