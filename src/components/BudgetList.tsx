import React, { useState } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import BudgetCard from './BudgetCard';
import {useBudgets} from '../hooks/useBudgets'; // adjust path as needed
import PageWrapper from './PageWrapper'; // adjust if needed

const BudgetList: React.FC = () => {
  const { budgets, loading } = useBudgets();
  const [selectedCategory, setSelectedCategory] = useState('all');

  if (loading) {
    return <Typography>Loading budgets...</Typography>;
  }

  const allCategories = Array.from(
    new Set(budgets.flatMap((b) => b.categories.map((c) => c.name)))
  );

  const filteredBudgets = budgets.filter((b) =>
    selectedCategory === 'all'
      ? true
      : b.categories.some((c) => c.name === selectedCategory)
  );

  return (
    <PageWrapper>
      <Box sx={{ mt: 4, maxWidth: '100%', pl: 0, pr: 0 }}>
        <Box
          display="grid"
          gap={3}
          sx={{
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              md: '1fr 1fr 1fr',
            },
          }}
        >
          {filteredBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              selectedCategory={selectedCategory}
            />
          ))}
        </Box>
      </Box>
    </PageWrapper>
  );
};

export default BudgetList;
