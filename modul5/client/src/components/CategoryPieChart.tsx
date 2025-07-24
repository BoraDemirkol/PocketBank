import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { categoryPieChartData } from '../data/mockData';

// Grafik dilimlerinin renklerini tanımlayalım
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const CategoryPieChart = () => {
  return (
    <PieChart width={700} height={400}>
      <Pie
        data={categoryPieChartData}
        cx="50%"
        cy="50%"
        labelLine={false}
        outerRadius={150}
        fill="#8884d8"
        dataKey="value"
        nameKey="name"
        label={(entry) => `${entry.name}: ${entry.value} TL`}
      >
        {categoryPieChartData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
};

export default CategoryPieChart;