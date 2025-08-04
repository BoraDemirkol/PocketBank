import React, { useMemo } from 'react';
import {
  CssBaseline,
  ThemeProvider as MuiThemeProvider,
  createTheme,
  Button,
} from '@mui/material';
import { ThemeProvider, useTheme } from './pages/ThemeContext';
import Module4Layout from './pages/Module4Layout';
import CreateBudget from './pages/CreateBudget';
import BudgetList from './pages/BudgetList';
import { supabase } from './supabaseClient';

console.log('Supabase client initialized:', supabase);
const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="outlined"
      onClick={toggleTheme}
      sx={{ position: 'absolute', top: 20, right: 20 }}
    >
      Tema: {theme === 'light' ? '🌞 Açık' : '🌙 Koyu'}
    </Button>
  );
};

const ThemedApp: React.FC = () => {
  const { theme } = useTheme();
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme,
        },
      }),
    [theme]
  );

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <div style={{ padding: 20, position: 'relative' }}>
        <h1>🏦 PocketBank - Modül Seçici</h1>
        <ThemeToggle />
        <Module4Layout
          renderCreate={<CreateBudget />}
          renderList={<BudgetList />}
        />
      </div>
    </MuiThemeProvider>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default App;