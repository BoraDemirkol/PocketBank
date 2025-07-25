import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { supabase } from '../supabaseClient';

// Grafik dilimlerinin renklerini tanımlayalım
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

// Verinin nasıl görüneceğini tanımlayalım (TypeScript için)
interface ChartData {
  name: string;
  value: number;
}

const CategoryPieChart = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      // Supabase'deki 'transactions' tablosundan tüm verileri çekiyoruz.
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          amount,
          categories ( name )
        `);

      if (error) {
        console.error('Veri çekerken hata:', error);
        return; // Hata varsa fonksiyonu durdur
      }
      
      if (transactions) {
        const spendingByCategory: { [key: string]: number } = {};

        // Gelen verinin tipinin any olduğunu belirtiyoruz, çünkü Supabase'den dinamik geliyor
        transactions.forEach((transaction: any) => {
          // Sadece giderleri hesaba katalım (amount < 0 ise)
          if (transaction.amount < 0) {
            const categoryName = transaction.categories?.name || 'Diğer';
            const amount = Math.abs(transaction.amount); // Negatif değeri pozitife çevir

            if (spendingByCategory[categoryName]) {
              spendingByCategory[categoryName] += amount;
            } else {
              spendingByCategory[categoryName] = amount;
            }
          }
        });

        // Hesaplanan veriyi Recharts'ın istediği formata dönüştür
        const formattedData: ChartData[] = Object.keys(spendingByCategory).map((key) => ({
          name: key,
          value: spendingByCategory[key],
        }));

        setChartData(formattedData);
      }
    };

    fetchTransactions();
  }, []); // Boş dizi, bu fonksiyonun sadece bir kere çalışmasını sağlar.

  // Veri henüz yüklenmediyse bir "Yükleniyor..." mesajı gösterelim
  if (chartData.length === 0) {
    return <div>Grafik verisi yükleniyor...</div>;
  }

  // Her bir dilim için özel label fonksiyonu
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <PieChart width={700} height={400}>
      <Pie
        data={chartData}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={renderCustomizedLabel} // <-- Temiz bir fonksiyon kullandık
        outerRadius={150}
        fill="#8884d8"
        dataKey="value"
        nameKey="name"
      >
        {chartData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(value: number) => `${value.toFixed(2)} TL`} />
      <Legend />
    </PieChart>
  );
};

export default CategoryPieChart;