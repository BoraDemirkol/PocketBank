import React, { useState } from 'react';
import Module4Layout from './pages/Module4Layout';

const App: React.FC = () => {
  const [showModule4, setShowModule4] = useState(false);

  return (
    <div style={{ padding: 20 }}>
      <h1>🏦 PocketBank - Modül Seçici</h1>
      <button
        onClick={() => {
          setShowModule4(false); // Close first (forces remount)
          setTimeout(() => setShowModule4(true), 0); // Open again, resets Module4Layout to Ana Sayfa
        }}
        style={{ marginBottom: 16 }}
      >
        Modül 4 - Bütçe Planlayıcıyı Aç
      </button>
      <hr />
      {showModule4 && <Module4Layout />}
    </div>
  );
};

export default App;
// filepath: c:\Users\Defne\PocketBank\src\App.tsx