import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import PageWrapper from '../components/PageWrapper';
import BudgetCard from '../components/BudgetCard';
import { useBudgets } from '../hooks/useBudgets'; // new hook

const BudgetListPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const { budgets, loading } = useBudgets();

  console.log('Budgets fetched:', budgets);

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
        <Typography variant="h4" gutterBottom>
          📋 Bütçeler
        </Typography>

        <Box sx={{ maxWidth: 240, mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel>Kategori</InputLabel>
            <Select
              value={selectedCategory}
              label="Kategori"
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <MenuItem value="all">Hepsi</MenuItem>
              {allCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Typography>Yükleniyor...</Typography>
        ) : (
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
        )}
      </Box>
    </PageWrapper>
  );
};

export default BudgetListPage;
