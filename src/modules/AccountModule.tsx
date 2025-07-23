import React, { useState } from 'react';

interface Account {
    id: number;
    name: string;
    type: 'checking' | 'savings' | 'credit';
    balance: number;
}

const AccountModule: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [name, setName] = useState('');
    const [type, setType] = useState<'checking' | 'savings' | 'credit'>('checking');

    const createAccount = () => {
        const newAccount: Account = {
            id: accounts.length + 1,
            name,
            type,
            balance: Math.floor(Math.random() * 10000) + 1000 // sahte bakiye
        };
        setAccounts([...accounts, newAccount]);
        setName('');
        setType('checking');
    };

    return (
        <div>
            <h2>📂 Modül 2: Account Management</h2>

            {/* Hesap Oluştur */}
            <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h3>🧾 Yeni Hesap Oluştur</h3>
                <label>Hesap Adı:</label><br />
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Maaş Hesabı" />
                <br /><br />
                <label>Hesap Türü:</label><br />
                <select value={type} onChange={(e) => setType(e.target.value as any)}>
                    <option value="checking">Vadesiz</option>
                    <option value="savings">Vadeli</option>
                    <option value="credit">Kredi</option>
                </select>
                <br /><br />
                <button onClick={createAccount}>Hesap Oluştur</button>
            </div>

            {/* Hesap Listesi */}
            <div style={{ marginTop: '30px' }}>
                <h3>📋 Hesaplarım</h3>
                {accounts.length === 0 ? (
                    <p>Henüz hesap eklenmedi.</p>
                ) : (
                    <table border={1} cellPadding={10} style={{ width: '100%', marginTop: '10px' }}>
                        <thead>
                        <tr>
                            <th>Hesap Adı</th>
                            <th>Tür</th>
                            <th>Bakiye</th>
                            <th>İşlem Geçmişi</th>
                            <th>Ekstre</th>
                        </tr>
                        </thead>
                        <tbody>
                        {accounts.map((acc) => (
                            <tr key={acc.id}>
                                <td>{acc.name}</td>
                                <td>{acc.type}</td>
                                <td>{acc.balance.toLocaleString()} ₺</td>
                                <td>
                                    <button onClick={() => alert("Göstermek için backend'den işlem listesi çekilir")}>Göster</button>
                                </td>
                                <td>
                                    <button onClick={() => alert("PDF ekstre üretmek için .NET backend çağrılır")}>PDF Oluştur</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AccountModule;
