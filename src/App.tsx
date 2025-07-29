import React, { useEffect, useMemo, useState } from 'react';
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
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4000/api/items')
      .then(response => response.json())
      .then(data => setData(data))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

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
        {/* Display API data here */}
        <h2>API'den Gelen Veri:</h2>
        <pre>{JSON.stringify(data, null, 2)}</pre>
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