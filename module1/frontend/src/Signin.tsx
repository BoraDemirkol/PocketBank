import './Signin.css'
import Login from './Login.tsx'
import { AuthProvider } from './AuthContext.tsx'

function Signin() {
  return (
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
}

export default Signin;
