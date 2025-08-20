import { Routes, Route, Link } from 'react-router-dom'
<<<<<<< HEAD
import { Layout, Typography } from '../node_modules/antd'
=======
import { Layout, Typography } from 'antd'
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
import { useTranslation } from 'react-i18next'
import Mainpage from './Mainpage.tsx'
import Signin from './Signin.tsx'
import Signup from './Signup.tsx'
import Dashboard from './Dashboard.tsx'
import EmailVerification from './EmailVerification.tsx'
import EditProfile from './EditProfile.tsx'
import ThemeToggle from './ThemeToggle.tsx'
import ForgotPassword from './ForgotPassword.tsx'
import ResetPassword from './ResetPassword.tsx'
import LanguageToggle from './LanguageToggle.tsx'
<<<<<<< HEAD
=======
import TransactionManagement from './components/transaction/TransactionManagement.tsx'
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

function App() {
  const { t } = useTranslation();
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
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
            {t('pocketbank')}
          </Title>
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </Header>
      <Content style={{ 
        flex: 1,
        backgroundColor: 'var(--content-bg)',
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(46, 125, 50, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(46, 125, 50, 0.06) 0%, transparent 50%),
          linear-gradient(45deg, rgba(46, 125, 50, 0.02) 25%, transparent 25%),
          linear-gradient(-45deg, rgba(46, 125, 50, 0.02) 25%, transparent 25%)
        `,
        backgroundSize: '200px 200px, 300px 300px, 20px 20px, 20px 20px',
        padding: '40px'
      }}>
        <Routes>
          <Route path="/" element={<Mainpage />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
<<<<<<< HEAD
=======
          <Route path="/transactions" element={<TransactionManagement />} />
>>>>>>> 9100c27ce5793f4af8ad037a2cd89bdf89599a38
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/auth/confirm" element={<EmailVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </Content>
      <Footer style={{ 
        textAlign: 'center', 
        backgroundColor: '#4a7c59', 
        color: 'white',
        padding: '20px 0'
      }}>
        <Typography.Text style={{ color: 'white', fontSize: '14px' }}>
          {t('copyright')}
        </Typography.Text>
      </Footer>
    </Layout>
  )
}

export default App