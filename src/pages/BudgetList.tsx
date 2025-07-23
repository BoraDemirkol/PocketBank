import React, { useState } from 'react';
import {
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import BudgetCard from '../components/BudgetCard';
import { mockBudgets } from '../mock/mockBudgets';

const BudgetList: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Tüm kategorileri toplamak için (eşsiz)
  const allCategories = Array.from(
    new Set(mockBudgets.flatMap((b) => b.categories.map((c) => c.name)))
  );

  const filteredBudgets =
    selectedCategory === 'all'
      ? mockBudgets
      : mockBudgets.filter((b) =>
          b.categories.some((c) => c.name === selectedCategory)
        );

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        📊 Bütçelerim
      </Typography>

      <Box sx={{ mb: 3, maxWidth: 300 }}>
        <FormControl fullWidth>
          <InputLabel>Kategori Filtrele</InputLabel>
          <Select
            value={selectedCategory}
            label="Kategori Filtrele"
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <MenuItem value="all">Tümü</MenuItem>
            {allCategories.map((cat, i) => (
              <MenuItem key={i} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {filteredBudgets.map((budget) => (
        <BudgetCard key={budget.id} budget={budget} />
      ))}
    </Container>
  );
};

export default BudgetList;
