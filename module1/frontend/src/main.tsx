import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider, App as AntApp } from '../node_modules/antd'
import './index.css'
import './i18n'
import App from './App.tsx'
import { AuthProvider } from './AuthContext.tsx'
import { ThemeProvider, useTheme } from './ThemeContext.tsx'
import { lightTheme, darkTheme } from './ThemeConfig.tsx'

const AppWithTheme = () => {
  const { theme: currentTheme } = useTheme();
  
  return (
    <ConfigProvider
      theme={currentTheme === 'dark' ? darkTheme : lightTheme}
    >
      <AntApp>
        <App />
      </AntApp>
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
