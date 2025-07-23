import React, { useState } from 'react';

interface Account {
    id: number;
    name: string;
    type: 'Vadesiz' | 'Vadeli' | 'Kredi Kartı';
    balance: number;
}

const AccountModule: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [name, setName] = useState('');
    const [type, setType] = useState<'Vadesiz' | 'Vadeli' | 'Kredi Kartı'>('Vadesiz');
    const [selectedType, setSelectedType] = useState<'Vadesiz' | 'Vadeli' | 'Kredi Kartı' | 'All'>('All');
    const [error, setError] = useState('');

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
        setType('Vadesiz');
    };

    const filteredAccounts =
        selectedType === 'All' ? accounts : accounts.filter(acc => acc.type === selectedType);

    return (
        <div style={{ padding: '20px' }}>
            <h2>📁 Modül 2: Account Management</h2>

            {/* Hesap Oluştur */}
            <div
                style={{
                    border: '1px solid #ccc',
                    borderRadius: '10px',
                    padding: '20px',
                    marginTop: '20px',
                    maxWidth: 500,
                    backgroundColor: '#fdfdfd',
                    boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
                }}
            >
                <h3 style={{ marginBottom: 10 }}>🆕 Yeni Hesap Oluştur</h3>
                <label>Hesap Adı:</label><br />
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: Maaş Hesabı"
                    style={{
                        width: '100%',
                        padding: 8,
                        marginBottom: 10,
                        borderRadius: 5,
                        border: '1px solid #ccc'
                    }}
                />
                <br />
                <label>Hesap Türü:</label><br />
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    style={{
                        width: '100%',
                        padding: 8,
                        marginBottom: 10,
                        borderRadius: 5,
                        border: '1px solid #ccc'
                    }}
                >
                    <option value="Vadesiz">Vadesiz</option>
                    <option value="Vadeli">Vadeli</option>
                    <option value="Kredi Kartı">Kredi Kartı</option>
                </select>

                {error && (
                    <p style={{ color: 'red', fontSize: '0.9em', marginBottom: 10 }}>{error}</p>
                )}

                <button
                    onClick={createAccount}
                    style={{
                        backgroundColor: '#764ba2',
                        color: 'white',
                        padding: '10px 16px',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer'
                    }}
                >
                    Hesap Oluştur
                </button>
            </div>

            {/* Filtre Butonları */}
            <div style={{ marginTop: 40 }}>
                <h3>📋 Hesaplarım</h3>
                <div style={{ marginBottom: 20, flexWrap: 'wrap', display: 'flex' }}>
                    {['All', 'Vadesiz', 'Vadeli', 'Kredi Kartı'].map(t => (
                        <button
                            key={t}
                            onClick={() => setSelectedType(t as any)}
                            style={{
                                marginRight: 10,
                                marginBottom: 10,
                                padding: '6px 14px',
                                borderRadius: 20,
                                backgroundColor: selectedType === t ? '#764ba2' : '#eee',
                                color: selectedType === t ? 'white' : '#333',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Kart Carousel */}
            {filteredAccounts.length === 0 ? (
                <p>Seçilen türde hesap bulunamadı.</p>
            ) : (
                <div style={{ position: 'relative' }}>
                    {/* Scrollable container */}
                    <div
                        id="scroll-container"
                        style={{
                            display: 'flex',
                            overflowX: 'auto',
                            scrollSnapType: 'x mandatory',
                            gap: '16px',
                            paddingBottom: '10px'
                        }}
                    >
                        {filteredAccounts.map(account => (
                            <div
                                key={account.id}
                                style={{
                                    flex: '0 0 calc(25% - 12px)',
                                    minWidth: '250px',
                                    scrollSnapAlign: 'start',
                                    background: '#fafafa',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    borderLeft: `5px solid ${account.type === 'Vadesiz' ? '#667eea' :
                                        account.type === 'Vadeli' ? '#4caf50' : '#e53935'}`,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                            >
                                <h4 style={{ color: '#764ba2' }}>{account.name}</h4>
                                <p><strong>Tür:</strong> {account.type}</p>
                                <p>
                                    <strong>Bakiye:</strong>{' '}
                                    {account.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                </p>
                                <div style={{ marginTop: 10 }}>
                                    <button onClick={() => alert("İşlem geçmişi gösterilir")} style={{ marginRight: 6 }}>Geçmiş</button>
                                    <button onClick={() => alert("PDF ekstresi oluşturulur")}>Ekstre</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Ok Butonları */}
                    <button
                        onClick={() => {
                            const container = document.getElementById('scroll-container');
                            container?.scrollBy({ left: -300, behavior: 'smooth' });
                        }}
                        style={{
                            position: 'absolute',
                            left: -10,
                            top: '40%',
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            backgroundColor: '#fff',
                            border: '1px solid #ccc',
                            borderRadius: '50%',
                            width: 30,
                            height: 30,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}
                    >‹</button>

                    <button
                        onClick={() => {
                            const container = document.getElementById('scroll-container');
                            container?.scrollBy({ left: 300, behavior: 'smooth' });
                        }}
                        style={{
                            position: 'absolute',
                            right: -10,
                            top: '40%',
                            transform: 'translateY(-50%)',
                            zIndex: 10,
                            backgroundColor: '#fff',
                            border: '1px solid #ccc',
                            borderRadius: '50%',
                            width: 30,
                            height: 30,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}
                    >›</button>
                </div>
            )}
        </div>
    );
};

export default AccountModule;
