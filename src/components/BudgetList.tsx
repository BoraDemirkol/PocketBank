import React from 'react';
import { Box } from '@mui/material';
import BudgetCard from './BudgetCard';
import { mockBudgets } from '../mock/mockBudgets';

const BudgetList: React.FC = () => (
  <Box
    display="grid"
    gap={3}
    sx={{
      gridTemplateColumns: {
        xs: '1fr',           // mobilde tek sütun
        sm: '1fr 1fr',       // tablet gibi ekranda 2 sütun
        md: '1fr 1fr 1fr',   // büyük ekranda 3 sütun
      },
    }}
  >
    {mockBudgets.map((budget) => (
      <BudgetCard
        key={budget.id}
        name={budget.name}
        amount={budget.amount}
        spent={budget.spent}
        categories={budget.categories}
        period={budget.period}
        startDate={budget.startDate}
      />
    ))}
  </Box>
);

export default BudgetList;
