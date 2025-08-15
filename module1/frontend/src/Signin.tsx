import './Signin.css'
import Login from './Login.tsx'
import { AuthProvider } from './contexts/AuthContext'

function Signin() {
  return (
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
}

export default Signin;
