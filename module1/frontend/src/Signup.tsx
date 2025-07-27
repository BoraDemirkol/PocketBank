import './Signup.css'
import Register from './Register.tsx'
import { AuthProvider } from './AuthContext.tsx'

function Signup() {
  return (
    <AuthProvider>
      <Register />
    </AuthProvider>
  );
}

export default Signup;
