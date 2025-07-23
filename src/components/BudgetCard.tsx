import React from 'react';
import {
  Card,
  CardContent,
  LinearProgress,
  Typography,
  Box
} from '@mui/material';

interface Category {
  name: string;
  limit: number;
  spent: number;
}

interface Budget {
  name: string;
  amount: number;
  spent: number;
  categories: Category[];
  period: string;
  startDate: string;
  endDate?: string;
}

const BudgetCard: React.FC<{ budget: Budget }> = ({ budget }) => {
  const progress = (budget.spent / budget.amount) * 100;
  const remaining = budget.amount - budget.spent;

  return (
    <Card sx={{ mb: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{budget.name}</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {budget.period === 'monthly' ? 'Aylık Bütçe' : 'Yıllık Bütçe'} ({budget.startDate} - {budget.endDate})
        </Typography>

        <Box display="flex" justifyContent="space-between" mt={1} mb={0.5}>
          <Typography variant="body2">Harcandı: {budget.spent} TL</Typography>
          <Typography variant="body2">Kalan: {remaining} TL</Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8,
            borderRadius: 5,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: progress >= 80 ? '#ff6f61' : '#4caf50',
            },
          }}
        />

        <Typography variant="caption" display="block" mt={1}>
          %{Math.round(progress)} harcandı
        </Typography>

        {progress >= 80 && (
          <Typography color="error" variant="caption" fontWeight="bold">
            ⚠️ Bütçenizin %80’ine ulaştınız!
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetCard;
