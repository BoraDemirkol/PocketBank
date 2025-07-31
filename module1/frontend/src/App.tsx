import { Routes, Route, Link } from 'react-router-dom'
import { Layout, Typography } from '../node_modules/antd'
import Mainpage from './Mainpage.tsx'
import Signin from './Signin.tsx'
import Signup from './Signup.tsx'
import Dashboard from './Dashboard.tsx'
import EmailVerification from './EmailVerification.tsx'
import EditProfile from './EditProfile.tsx'

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        justifyContent: 'flex-start', 
        alignItems: 'center',
        background: '#4a7c59',
        padding: '0 20px'
      }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Title 
            level={3} 
            style={{ 
              color: 'white', 
              margin: 0, 
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
              fontWeight: 800,
              letterSpacing: '2px',
              fontSize: '24px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            PocketBank
          </Title>
        </Link>
      </Header>
      <Content style={{ 
        flex: 1,
        backgroundColor: '#f8faf9',
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(74, 124, 89, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(74, 124, 89, 0.06) 0%, transparent 50%),
          linear-gradient(45deg, rgba(74, 124, 89, 0.02) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(74, 124, 89, 0.02) 25%, transparent 25%)
        `,
        backgroundSize: '200px 200px, 300px 300px, 20px 20px, 20px 20px',
        padding: '40px'
      }}>
        <Routes>
          <Route path="/" element={<Mainpage />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/auth/confirm" element={<EmailVerification />} />
        </Routes>
      </Content>
      <Footer style={{ 
        textAlign: 'center', 
        backgroundColor: '#4a7c59', 
        color: 'white',
        padding: '20px 0'
      }}>
        <Typography.Text style={{ color: 'white', fontSize: '14px' }}>
          © 2025 PocketBank. All rights reserved.
        </Typography.Text>
      </Footer>
    </Layout>
  )
}

export default App