import './Signup.css'
import Register from './Register.tsx'
import { AuthProvider } from './contexts/AuthContext'

function Signup() {
  return (
    <AuthProvider>
      <Register />
    </AuthProvider>
  );
}

export default Signup;
