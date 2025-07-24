import React, { useState } from 'react';
import { Box, Button, Stack, Divider } from '@mui/material';

import Home from './Home';
import CreateBudget from './CreateBudget';
import BudgetList from './BudgetList';

interface Module4LayoutProps {
  initialView?: 'home' | 'create' | 'list';
}

const Module4Layout: React.FC<Module4LayoutProps> = ({ initialView = 'home' }) => {
  const [view, setView] = useState<'home' | 'create' | 'list'>(initialView);

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button
          variant={view === 'home' ? 'contained' : 'outlined'}
          onClick={() => setView('home')}
        >
          Ana Sayfa
        </Button>
        <Button
          variant={view === 'list' ? 'contained' : 'outlined'}
          onClick={() => setView('list')}
        >
          Bütçeleri Gör
        </Button>
        <Button
          variant={view === 'create' ? 'contained' : 'outlined'}
          onClick={() => setView('create')}
        >
          Yeni Bütçe Oluştur
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {view === 'home' && <Home onNavigate={setView} />}
      {view === 'list' && <BudgetList />}
      {view === 'create' && <CreateBudget />}
    </Box>
  );
};

export default Module4Layout;