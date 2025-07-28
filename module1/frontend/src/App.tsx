import { Routes, Route } from 'react-router-dom'
import Mainpage from './Mainpage.tsx'
import Signin from './Signin.tsx'
import Signup from './Signup.tsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Mainpage />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
    </Routes>
  )
}

export default App