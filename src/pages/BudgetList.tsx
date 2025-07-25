import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import PageWrapper from '../components/PageWrapper';
import BudgetCard from '../components/BudgetCard';
import { mockBudgets } from '../mock/mockBudgets';

const BudgetListPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');

  const allCategories = Array.from(
    new Set(mockBudgets.flatMap((b) => b.categories.map((c) => c.name)))
  );
  const filteredBudgets = mockBudgets.filter((b) =>
    selectedCategory === 'all'
      ? true
      : b.categories.some((c) => c.name === selectedCategory)
  );

  return (
    <PageWrapper>
      <Container sx={{ mt: 4 }}>
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
              name={budget.name}
              amount={budget.amount}
              spent={budget.spent}
              categories={budget.categories}
              period={budget.period}
              startDate={budget.startDate}
            />
          ))}
        </Box>
      </Container>
    </PageWrapper>
  );
};

export default BudgetListPage;
