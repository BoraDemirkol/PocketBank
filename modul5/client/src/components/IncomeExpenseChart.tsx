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

// Aylık veri formatımızı tanımlayalım
interface MonthlyData {
  month: string;
  gelir: number;
  gider: number;
}

const IncomeExpenseChart = () => {
  const [chartData, setChartData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      // Supabase'den sadece 'amount' ve 'transaction_date' sütunlarını çekiyoruz
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, transaction_date');

      if (error) {
        console.error('Aylık veri çekerken hata:', error);
        return;
      }

      if (transactions) {
        // Gelen veriyi aylara göre gruplayacağımız bir yapı oluşturalım
        const monthlySummary: { [key: string]: { gelir: number; gider: number } } = {};

        transactions.forEach((transaction: any) => {
          const date = new Date(transaction.transaction_date);
          // Örneğin "Temmuz" gibi ay ismini alıyoruz
          const monthName = date.toLocaleString('tr-TR', { month: 'long' });
          const amount = transaction.amount;

          // Eğer o ay için bir girdimiz yoksa, oluşturalım
          if (!monthlySummary[monthName]) {
            monthlySummary[monthName] = { gelir: 0, gider: 0 };
          }

          // İşlem tutarına göre gelir veya gideri toplayalım
          if (amount > 0) {
            monthlySummary[monthName].gelir += amount;
          } else {
            monthlySummary[monthName].gider += Math.abs(amount);
          }
        });

        // Hesaplanan veriyi Recharts'ın istediği formata dönüştürelim
        const formattedData: MonthlyData[] = Object.keys(monthlySummary).map(month => ({
          month: month,
          gelir: monthlySummary[month].gelir,
          gider: monthlySummary[month].gider,
        }));
        
        setChartData(formattedData);
      }
    };

    fetchMonthlyData();
  }, []); // Sadece bir kere çalıştır

  if (chartData.length === 0) {
    return <div>Gelir-Gider verisi yükleniyor...</div>;
  }

  return (
    <ResponsiveContainer width="95%" height={400}>
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip formatter={(value: number) => `${value.toFixed(2)} TL`} />
        <Legend />
        <Line type="monotone" dataKey="gelir" stroke="#82ca9d" name="Gelir" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="gider" stroke="#FF5733" name="Gider" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default IncomeExpenseChart;