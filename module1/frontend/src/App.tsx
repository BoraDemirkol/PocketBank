import './App.css'
import Login from './Login.tsx'
import Dashboard from './Dashboard.tsx'
import { AuthProvider, useAuth } from './AuthContext'

function AppContent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? <Dashboard /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
