// src/pages/Module4Layout.tsx
import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Stack,
  Button
} from '@mui/material';
import Home from './Home';
import BudgetList from './BudgetList';
import CreateBudget from './CreateBudget';
import { useBudgets } from '../hooks/useBudgets';

const Module4Layout: React.FC = () => {
  const [view, setView] = useState<'home' | 'list' | 'create'>('home');
  const { budgets } = useBudgets();
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const remaining = budgets.reduce((sum, b) => sum + b.amount, 0) - totalSpent;

  return (
    <Box>
      {/* Üst AppBar ve Butonlar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" color="primary">
            🏦 PocketBank - Modül Seçici
          </Typography>
          <Stack direction="row" spacing={1}>
           
            <Button
              variant={view === 'list' ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => setView('list')}
            >
              Bütçeleri Gör
            </Button>
            <Button
              variant={view === 'create' ? 'contained' : 'outlined'}
              color="primary"
              onClick={() => setView('create')}
            >
              Yeni Bütçe
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => alert(`Toplam Harcama: ${totalSpent} TL`)}
            >
              Toplam Harcama
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => alert(`Kalan Bakiye: ${remaining} TL`)}
            >
              Kalan Bakiye
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* İçerik Alanı */}
      <Container sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
            
          {view === 'list' && <BudgetList />}
          {view === 'create' && <CreateBudget />}
        </Paper>
      </Container>
    </Box>
  );
};

export default Module4Layout;