import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import TransactionModule from './modules/TransactionModule';

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <div>
                <TransactionModule />
            </div>
        </ThemeProvider>
    );
};

export default App;
