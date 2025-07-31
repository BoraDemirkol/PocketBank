import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, theme } from '../node_modules/antd'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './AuthContext.tsx'
import { ThemeProvider, useTheme } from './ThemeContext.tsx'

const AppWithTheme = () => {
  const { theme: currentTheme } = useTheme();
  
  return (
    <ConfigProvider
      theme={{
        algorithm: currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#4a7c59',
        },
      }}
    >
      <App />
    </ConfigProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppWithTheme />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
