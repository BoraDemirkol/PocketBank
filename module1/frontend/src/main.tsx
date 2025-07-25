import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Mainpage from './Mainpage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Mainpage />
  </StrictMode>,
)
