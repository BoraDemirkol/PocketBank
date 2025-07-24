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
import { incomeExpenseLineChartData } from '../data/mockData';

const IncomeExpenseChart = () => {
  return (
    // ResponsiveContainer, grafiğin ekrana sığmasını sağlar
    <ResponsiveContainer width="95%" height={400}>
      <LineChart
        data={incomeExpenseLineChartData}
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
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="gelir" stroke="#82ca9d" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="gider" stroke="#FF5733" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default IncomeExpenseChart;