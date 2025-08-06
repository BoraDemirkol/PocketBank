// src/pages/Home.tsx
import React from 'react';
import {
  Container,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import PageWrapper from '../components/PageWrapper';
import BudgetList from '../components/BudgetList';
import { useBudgets } from '../hooks/useBudgets';

const Home: React.FC = () => {
  const { budgets, loading, error } = useBudgets();

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent  = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remaining   = totalBudget - totalSpent;

  return (
    <PageWrapper>
      <Container sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          💰 PocketBank - Bütçe Planlayıcı
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Harcamalarını kolayca yönet, bütçeni kontrol altında tut!
        </Typography>

        {/* Buton navigasyonları AppBar’da taşındı, buradaki kaldırıldı */}

        {/* Dashboard: Bütçe Kartları */}
        <Box sx={{ mt: 6, px: { xs: 2, md: 4 } }}>
          <BudgetList />
        </Box>
      </Container>
    </PageWrapper>
  );
};

export default Home;