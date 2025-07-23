import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TopBar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1565c0' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
          🧾 PocketBank
        </Typography>
        <Box>
          <Button color="inherit" onClick={() => navigate('/budgets')}>
            Bütçelerim
          </Button>
          <Button color="inherit" onClick={() => navigate('/create-budget')}>
            Yeni Bütçe
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
