import React, { useState } from 'react';
import AccountModule from './modules/AccountModule';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState(false);

  return (
      <div style={{ padding: 20 }}>
        <h1>🏦 PocketBank - Modül Seçici</h1>
        <button onClick={() => setActiveModule(true)}>Modül 2 - Account Management</button>
        <hr />
        {activeModule && <AccountModule />}
      </div>
  );
};

export default App;
