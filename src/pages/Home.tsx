import React from 'react';
import {
  Container,
  Box,
  Stack,
  Button,
  Typography
} from '@mui/material';
import PageWrapper from '../components/PageWrapper';
import BudgetList from '../components/BudgetList';
import { mockBudgets } from '../mock/mockBudgets';

{/* Yeni değişikliklerden sonra home sayfası kullanılmıyor*/}

interface HomeProps {
  onNavigate: (view: 'home' | 'create' | 'list') => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  // Özet istatistik hesaplamaları
  const totalBudget = mockBudgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = mockBudgets.reduce((sum, b) => sum + b.spent, 0);
  const remaining = totalBudget - totalSpent;

  return (
    <PageWrapper>
      <Container sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          💰 PocketBank - Bütçe Planlayıcı
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Harcamalarını kolayca yönet, bütçeni kontrol altında tut!
        </Typography>

        <Box mt={6}>
          <Stack direction="column" spacing={2} alignItems="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => onNavigate('list')}
            >
              📋 Bütçeleri Gör
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => onNavigate('create')}
            >
              ➕ Yeni Bütçe Oluştur
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => alert(`Toplam Harcama: ${totalSpent} TL`)}
            >
              💸 Toplam Harcama
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => alert(`Kalan Bakiye: ${remaining} TL`)}
            >
              🏦 Kalan Bakiye
            </Button>
          </Stack>
        </Box>

        {/* Dashboard: Bütçe Kartları */}
        {/* <Box sx={{ mt: 6, px: { xs: 2, md: 4 } }}>
          <BudgetList />
        </Box> */}
      </Container>
    </PageWrapper>
  );
};

export default Home;
