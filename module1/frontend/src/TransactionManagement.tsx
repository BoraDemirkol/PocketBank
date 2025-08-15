import React from 'react';
import { TransactionModule } from './components/transactions';

const TransactionManagement: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#2D2D2D'
    }}>
      <TransactionModule />
    </div>
  );
};

export default TransactionManagement;
