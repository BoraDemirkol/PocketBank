import React from 'react';

const Header = () => {
 const headerStyle: React.CSSProperties = {
 backgroundColor: '#206524ff', // Ana yeşil renk
 color: 'white',
 padding: '15px 30px',
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center',
 boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
 };

 const logoStyle: React.CSSProperties = {
 fontWeight: 'bold',
 fontSize: '1.8em',
 letterSpacing: '1px'
 };

 return (
 <header style={headerStyle}>
 <div style={logoStyle}>POCKETBANK</div>
 <div>
 {/* İngilizce seçeneği ve Logout butonu silindi */}
 </div>
 </header>
 );
};

export default Header; 
