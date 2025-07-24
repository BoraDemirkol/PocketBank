import React from 'react';
import { Container, Typography, Box, Button, Stack } from '@mui/material';
import PageWrapper from '../components/PageWrapper'; // optional animation

interface HomeProps {
  onNavigate: (view: 'home' | 'create' | 'list') => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
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
          <Stack direction="column" spacing={3} alignItems="center">
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => onNavigate('list')}
              sx={{
                width: '250px',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': { transform: 'scale(1.05)' },
              }}
            >
              📋 Bütçeleri Gör
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              size="large"
              onClick={() => onNavigate('create')}
              sx={{
                width: '250px',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': { transform: 'scale(1.05)' },
              }}
            >
              ➕ Yeni Bütçe Oluştur
            </Button>
          </Stack>
        </Box>
      </Container>
    </PageWrapper>
  );
};

export default Home;
