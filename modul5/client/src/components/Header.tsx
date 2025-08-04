import React from 'react';

const Header = () => {
  const headerStyle: React.CSSProperties = {
    backgroundColor: '#2e7d32',
    width: '100%',
    padding: '16px 0',
    color: 'white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start', // SOLA yaslıyoruz
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '1.8em',
    fontWeight: 'bold',
    letterSpacing: '1px',
    margin: 0,
    color: 'white', // 💡 Beyaz renk garanti olsun
  };

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <h1 style={logoStyle}>POCKETBANK</h1>
      </div>
    </header>
  );
};

export default Header;

