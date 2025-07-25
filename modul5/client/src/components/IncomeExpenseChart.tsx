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

// Aylık veri formatımızı birikim içerecek şekilde güncelleyelim
interface MonthlyData {
  month: string;
  gelir: number;
  gider: number;
  birikim: number; // YENİ: Birikim alanı eklendi
}

const IncomeExpenseChart = () => {
  const [chartData, setChartData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, transaction_date');

      if (error) {
        console.error('Aylık veri çekerken hata:', error);
        return;
      }

      if (transactions) {
        const monthlySummary: { [key: string]: { gelir: number; gider: number } } = {};

        transactions.forEach((transaction: any) => {
          const date = new Date(transaction.transaction_date);
          const monthName = date.toLocaleString('tr-TR', { month: 'long' });
          const amount = transaction.amount;

          if (!monthlySummary[monthName]) {
            monthlySummary[monthName] = { gelir: 0, gider: 0 };
          }

          if (amount > 0) {
            monthlySummary[monthName].gelir += amount;
          } else {
            monthlySummary[monthName].gider += Math.abs(amount);
          }
        });

        // YENİ: Hesaplanan veriye "birikim" alanını ekliyoruz
        const formattedData: MonthlyData[] = Object.keys(monthlySummary).map(month => {
          const gelir = monthlySummary[month].gelir;
          const gider = monthlySummary[month].gider;
          return {
            month: month,
            gelir: gelir,
            gider: gider,
            birikim: gelir - gider, // Gelir - Gider = Birikim
          };
        });
        
        setChartData(formattedData);
      }
    };

    fetchMonthlyData();
  }, []);

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
        {/* YENİ: Birikim için üçüncü çizgiyi ekledik */}
        <Line type="monotone" dataKey="birikim" stroke="#8884d8" name="Birikim" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default IncomeExpenseChart;