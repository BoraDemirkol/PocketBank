import './App.css'
import Login from './Login.tsx'
import { AuthProvider } from './AuthContext'

function App() {
  return (
    <AuthProvider>
      <Login />
    </AuthProvider>
  )
}

export default App
