import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateBudget from './pages/CreateBudget';
import BudgetList from './pages/BudgetList';
import TopBar from './components/TopBar';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565c0',
    },
    secondary: {
      main: '#ef6c00',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <TopBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-budget" element={<CreateBudget />} />
          <Route path="/budgets" element={<BudgetList />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
