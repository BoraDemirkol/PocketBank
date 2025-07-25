// src/components/BudgetCard.tsx
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Stack,
  Tooltip
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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
}

// Renk belirleme: %75 altı mavi, %75–100 sarı, üstü kırmızı
const getProgressColor = (pct: number) => {
  if (pct <= 75) return 'primary';
  if (pct <= 100) return 'warning';
  return 'error';
};

const BudgetCard: React.FC<Budget> = ({
  name,
  amount,
  spent,
  categories,
  period,
  startDate
}) => {
  const overallPct = Math.round((spent / amount) * 100);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">
          {name} ({period === 'monthly' ? startDate : `Yıllık: ${startDate}`})
        </Typography>
        <Typography variant="body2" gutterBottom>
          Gerçekleşen: <strong>{spent} TL</strong> / Bütçe: <strong>{amount} TL</strong>
        </Typography>
        <Box display="flex" alignItems="center" mb={1}>
          <Box flexGrow={1}>
            <LinearProgress
              variant="determinate"
              value={Math.min(overallPct, 100)}
              color={getProgressColor(overallPct)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Typography variant="caption" sx={{ ml: 1 }}>
            {overallPct}%
          </Typography>
        </Box>

        <Stack spacing={1} mt={2}>
          {categories.map((cat) => {
            const catPct = Math.round((cat.spent / cat.limit) * 100);
            return (
              <Box key={cat.name}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">{cat.name}</Typography>
                  <Typography variant="body2">
                    {cat.spent}/{cat.limit} TL
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Box flexGrow={1}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(catPct, 100)}
                      color={getProgressColor(catPct)}
                      sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                    />
                  </Box>
                  {catPct > 100 && (
                    <Tooltip title="Limit aşıldı!">
                      <WarningAmberIcon color="error" sx={{ ml: 1 }} />
                    </Tooltip>
                  )}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default BudgetCard;
