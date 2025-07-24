import React, { useState, useEffect } from 'react';
import { supabase } from '../Shared/supabaseClient';
import Layout from '../context/Layout';
import '../context/accountModule.css';

const fetchAccounts = async () => {
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', '0000-0000-0000-test-user');

    console.log(data, error);
};

interface Account {
    id: number;
    name: string;
    type: 'Vadesiz' | 'Vadeli' | 'Kredi Kartı';
    balance: number;
}

const AccountModule: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [name, setName] = useState('');
    const [type, setType] = useState<'Vadesiz' | 'Vadeli' | 'Kredi Kartı'>(() => {
        const saved = localStorage.getItem('lastSelectedType');
        return (saved as 'Vadesiz' | 'Vadeli' | 'Kredi Kartı') || 'Vadesiz';
    });
    const [selectedType, setSelectedType] = useState<'Vadesiz' | 'Vadeli' | 'Kredi Kartı' | 'All'>('All');
    const [error, setError] = useState('');
    const [cardWidth, setCardWidth] = useState('23%');
    const [hovering, setHovering] = useState(false);

    useEffect(() => {
        const updateWidth = () => {
            const w = window.innerWidth;
            if (w < 500) setCardWidth('90%');
            else if (w < 768) setCardWidth('48%');
            else if (w < 1024) setCardWidth('32%');
            else setCardWidth('23%');
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const generateRandomBalance = (type: string): number => {
        return type === 'Kredi Kartı'
            ? -(Math.floor(Math.random() * 5000) + 500)
            : Math.floor(Math.random() * 20000) + 1000;
    };

    const createAccount = () => {
        if (name.trim() === '') {
            setError('Hesap adı boş bırakılamaz.');
            return;
        }

        setError('');
        const newAccount: Account = {
            id: accounts.length + 1,
            name,
            type,
            balance: generateRandomBalance(type)
        };

        setAccounts([...accounts, newAccount]);
        setName('');
        localStorage.setItem('lastSelectedType', type);
    };

    const filteredAccounts =
        selectedType === 'All' ? accounts : accounts.filter(acc => acc.type === selectedType);

    return (
        <Layout>
            <div className="account-container">
                <h2 className="module-title">📁 Modül 2: Account Management</h2>

                <div className="create-card">
                    <h3>🆕 Yeni Hesap Oluştur</h3>
                    <label>Hesap Adı:</label><br />
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Maaş Hesabı" /><br />
                    <label>Hesap Türü:</label><br />
                    <select value={type} onChange={(e) => setType(e.target.value as any)}>
                        <option value="Vadesiz">Vadesiz</option>
                        <option value="Vadeli">Vadeli</option>
                        <option value="Kredi Kartı">Kredi Kartı</option>
                    </select>
                    {error && <p style={{ color: 'red', fontSize: '0.9em', marginBottom: 10 }}>{error}</p>}
                    <button onClick={createAccount}>Hesap Oluştur</button>
                </div>

                <div className="account-filter">
                    <h3>📋 Hesaplarım</h3>
                    <div className="account-filter-buttons">
                        {['All', 'Vadesiz', 'Vadeli', 'Kredi Kartı'].map(t => (
                            <button
                                key={t}
                                onClick={() => setSelectedType(t as any)}
                                style={{ backgroundColor: selectedType === t ? '#764ba2' : '#f1f1f1', color: selectedType === t ? 'white' : '#333' }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredAccounts.length === 0 ? (
                    <p>Seçilen türde hesap bulunamadı.</p>
                ) : (
                    <div className="account-card-container" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
                        <div className="account-card-scroll" id="scroll-container">
                            {filteredAccounts.map(account => (
                                <div
                                    key={account.id}
                                    className="account-card"
                                    style={{ flex: `0 0 ${cardWidth}`, borderLeft: `5px solid ${account.type === 'Vadesiz' ? '#667eea' : account.type === 'Vadeli' ? '#4caf50' : '#e53935'}` }}
                                >
                                    <h4>{account.name}</h4>
                                    <p><strong>Tür:</strong> {account.type}</p>
                                    <p><strong>Bakiye:</strong> {account.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</p>
                                    <div className="account-card-buttons">
                                        <button>Geçmiş</button>
                                        <button>Ekstre</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredAccounts.length > 4 && (
                            <>
                                <button
                                    onClick={() => {
                                        const container = document.getElementById('scroll-container');
                                        container?.scrollBy({ left: -300, behavior: 'smooth' });
                                    }}
                                    className={`account-scroll-button ${hovering ? 'visible' : ''}`}
                                    style={{ left: -10 }}
                                >‹</button>
                                <button
                                    onClick={() => {
                                        const container = document.getElementById('scroll-container');
                                        container?.scrollBy({ left: 300, behavior: 'smooth' });
                                    }}
                                    className={`account-scroll-button ${hovering ? 'visible' : ''}`}
                                    style={{ right: -10 }}
                                >›</button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default AccountModule;
