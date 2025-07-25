import './Signin.css'
import Login from './Login.tsx'
import Dashboard from './Dashboard.tsx'
import { AuthProvider, useAuth } from './AuthContext.tsx'

function AppContent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? <Dashboard /> : <Login />;
}

function Signin() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default Signin
