import React from 'react';
import { Card, CardContent, LinearProgress, Typography, Box, Stack, Tooltip } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface Category {
  name: string;
  limit: number;
  spent: number;
}

interface Budget {
  name: string;
  amount: number;
  categories: Category[];
  period: string;
}

const getProgressColor = (percent: number) => {
  if (percent >= 100) return 'error';
  if (percent >= 80) return 'warning';
  return 'primary';
};

const colorReferences = [
  { color: 'primary.main', label: 'Güvenli (<%80)' },
  { color: 'warning.main', label: 'Dikkat (%80-%99)' },
  { color: 'error.main', label: 'Aşıldı (%100+)' },
];

const BudgetCard: React.FC<{ budget: Budget; selectedCategory: string }> = ({ budget, selectedCategory }) => {
  const filteredCategories =
  selectedCategory === 'all'
    ? budget.categories
    : budget.categories.filter(cat => cat.name === selectedCategory);
  const totalSpent = filteredCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const progress = (totalSpent / budget.amount) * 100;

  return (
    <Card sx={{ mb: 3, boxShadow: 4, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>{budget.name}</Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Harcandı: {totalSpent} / {budget.amount} TL ({progress.toFixed(1)}%)
          </Typography>
          {progress >= 80 && (
            <Tooltip title={progress >= 100 ? "Bütçeniz aşıldı!" : "Bütçenizin %80’ine ulaştınız!"}>
              <WarningAmberIcon color="warning" fontSize="small" sx={{ cursor: 'pointer' }} />
            </Tooltip>
          )}
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress > 100 ? 100 : progress}
          color={getProgressColor(progress)}
          sx={{ mt: 1, mb: 2, height: 10, borderRadius: 5 }}
        />
        {progress >= 80 && (
          <Typography color="error" variant="caption" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            ⚠️ Bütçenizin %80’ine ulaştınız!
          </Typography>
        )}
        {/* Color Reference */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          {colorReferences.map(ref => (
            <Stack direction="row" alignItems="center" spacing={0.5} key={ref.label}>
              <Box sx={{ width: 16, height: 16, bgcolor: ref.color, borderRadius: '50%' }} />
              <Typography variant="caption">{ref.label}</Typography>
            </Stack>
          ))}
        </Stack>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Kategoriler:</Typography>
          {filteredCategories.map((cat) => {
            const catPercent = (cat.spent / cat.limit) * 100;
            return (
              <Box key={cat.name} sx={{ pl: 1, mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" sx={{ minWidth: 90 }}>
                    {cat.name}:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {cat.spent} / {cat.limit} TL ({catPercent.toFixed(1)}%)
                  </Typography>
                  {catPercent >= 80 && (
                    <Tooltip title={catPercent >= 100 ? "Kategori limiti aşıldı!" : "Kategori limitinin %80’ine ulaşıldı!"}>
                      <WarningAmberIcon color={catPercent >= 100 ? 'error' : 'warning'} fontSize="small" sx={{ cursor: 'pointer' }} />
                    </Tooltip>
                  )}
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={catPercent > 100 ? 100 : catPercent}
                  color={getProgressColor(catPercent)}
                  sx={{ mt: 0.5, height: 7, borderRadius: 5, width: '90%' }}
                />
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

export default BudgetCard;