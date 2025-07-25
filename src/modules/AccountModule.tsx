import React, { useState, useEffect } from 'react';
import Layout from '../context/Layout';
import '../context/accountModule.css';
import { fetchTransactionsByAccount, generateAccountStatementPDF } from '../services/accountService';
import { supabase } from '../Shared/supabaseClient';
import axios from 'axios';

interface Account {
    id: string;
    name: string;
    type: 'Vadesiz' | 'Vadeli' | 'Kredi Kartı';
    balance: number;
}

interface Transaction {
    id: string;
    account_id: string;
    category_id: string;
    amount: number;
    transaction_date: string;
    description: string;
}

interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
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
    const [transactions, setTransactions] = useState<Transaction[] | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'transactions' | 'categories' | 'import' | 'recurring'>('transactions');
    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState({
        amount: '',
        date: '',
        categoryId: '',
        description: '',
        isIncome: false,
        receipt: null as File | null,
    });
    const [formMsg, setFormMsg] = useState<string | null>(null);
    const [filter, setFilter] = useState({
        startDate: '',
        endDate: '',
        categoryId: '',
        minAmount: '',
        maxAmount: '',
        search: '',
    });
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[] | null>(null);

    // Kategori yönetimi için state
    const [newCategory, setNewCategory] = useState({
        name: '',
        color: '#764ba2',
        icon: '🗂️',
    });
    const [catMsg, setCatMsg] = useState<string | null>(null);
    const iconOptions = ['🛒','🍔','🚕','💡','🏠','💳','🎁','📚','🧾','🗂️'];
    const colorOptions = ['#764ba2','#4caf50','#e53935','#ff9800','#2196f3','#9c27b0','#607d8b','#ffeb3b'];

    // Toplu içe aktarma için state
    const [importedRows, setImportedRows] = useState<any[]>([]);
    const [importMsg, setImportMsg] = useState<string | null>(null);
    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            // Basit CSV parse (örnek veri)
            const text = evt.target?.result as string;
            const lines = text.split('\n').filter(Boolean);
            const headers = lines[0].split(',');
            const rows = lines.slice(1).map(line => {
                const values = line.split(',');
                const row: any = {};
                headers.forEach((h, i) => row[h.trim()] = values[i]?.trim());
                return row;
            });
            setImportedRows(rows);
            setImportMsg(`${rows.length} satır yüklendi.`);
        };
        reader.readAsText(file);
    };
    const handleImportCategoryChange = (idx: number, catId: string) => {
        setImportedRows(rows => rows.map((row, i) => i === idx ? { ...row, categoryId: catId } : row));
    };

    // Tekrarlayan işlemler için state
    const [recurrings, setRecurrings] = useState<any[]>([]);
    const [recForm, setRecForm] = useState({
        amount: '',
        description: '',
        categoryId: '',
        startDate: '',
        frequency: 'aylık',
    });
    const [recMsg, setRecMsg] = useState<string | null>(null);
    const freqOptions = ['günlük','haftalık','aylık','yıllık'];
    const handleRecFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setRecForm(f => ({ ...f, [name]: value }));
    };
    const handleAddRecurring = (e: React.FormEvent) => {
        e.preventDefault();
        if (!recForm.amount || !recForm.categoryId || !recForm.startDate) {
            setRecMsg('Tutar, kategori ve başlangıç tarihi zorunlu.');
            return;
        }
        setRecurrings(rs => [...rs, { ...recForm, id: Date.now() }]);
        setRecForm({ amount: '', description: '', categoryId: '', startDate: '', frequency: 'aylık' });
        setRecMsg('Tekrarlayan işlem eklendi!');
    };
    const handleDeleteRecurring = (id: number) => {
        setRecurrings(rs => rs.filter(r => r.id !== id));
    };

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

    useEffect(() => {
        const fetchAccounts = async () => {
            const { data, error } = await supabase
                .from('accounts')
                .select('*')
                .eq('user_id', '00000000-0000-0000-0000-000000000001');

            if (error) console.error('Hesaplar çekilemedi:', error);
            else setAccounts(
                data.map((item: any) => ({
                    id: item.id,
                    name: item.account_name,
                    type: item.account_type,
                    balance: item.balance
                }))
            );
        };

        fetchAccounts();
    }, []);

    useEffect(() => {
        // Kategorileri çek
        const fetchCategories = async () => {
            try {
                const res = await axios.get('/api/category');
                setCategories(res.data);
            } catch (err) {
                setCategories([]);
            }
        };
        fetchCategories();
    }, []);

    // Filtreleme işlemi
    useEffect(() => {
        if (!transactions) {
            setFilteredTransactions(null);
            return;
        }
        let txs = [...transactions];
        if (filter.startDate) txs = txs.filter(t => t.transaction_date >= filter.startDate);
        if (filter.endDate) txs = txs.filter(t => t.transaction_date <= filter.endDate);
        if (filter.categoryId) txs = txs.filter(t => t.category_id === filter.categoryId);
        if (filter.minAmount) txs = txs.filter(t => t.amount >= parseFloat(filter.minAmount));
        if (filter.maxAmount) txs = txs.filter(t => t.amount <= parseFloat(filter.maxAmount));
        if (filter.search) txs = txs.filter(t => t.description.toLowerCase().includes(filter.search.toLowerCase()));
        setFilteredTransactions(txs);
    }, [transactions, filter]);

    const generateRandomBalance = (type: string): number => {
        return type === 'Kredi Kartı'
            ? -(Math.floor(Math.random() * 5000) + 500)
            : Math.floor(Math.random() * 20000) + 1000;
    };

    const createAccount = async () => {
        if (name.trim() === '') {
            setError('Hesap adı boş bırakılamaz.');
            return;
        }

        setError('');
        const balance = generateRandomBalance(type);

        const { data, error } = await supabase.from('accounts').insert([
            {
                user_id: '00000000-0000-0000-0000-000000000001',
                account_name: name,
                account_type: type,
                balance,
                currency: 'TRY'
            }
        ]).select();

        if (error) {
            console.error('Hesap oluşturma hatası:', error);
        } else if (data && data.length > 0) {
            const newAccount = {
                id: data[0].id,
                name: data[0].account_name,
                type: data[0].account_type,
                balance: data[0].balance
            };
            setAccounts([...accounts, newAccount]);
            setName('');
            localStorage.setItem('lastSelectedType', type);
        }
    };

    const fetchTransactions = async (accountId: string) => {
        const { data, error } = await fetchTransactionsByAccount(accountId);
        if (error) {
            console.error('Transaction fetch error:', error);
            setTransactions(null);
        } else {
            setTransactions(data);
            setSelectedAccountId(accountId);
        }
    };

    const generatePDF = async (accountId: string) => {
        const { data, error } = await fetchTransactionsByAccount(accountId);
        if (data) generateAccountStatementPDF(data, accountId);
    };

    const filteredAccounts =
        selectedType === 'All' ? accounts : accounts.filter(acc => acc.type === selectedType);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked, files } = e.target as any;
        if (type === 'checkbox') {
            setForm(f => ({ ...f, [name]: checked }));
        } else if (type === 'file') {
            setForm(f => ({ ...f, [name]: files[0] }));
        } else {
            setForm(f => ({ ...f, [name]: value }));
        }
    };
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccountId) {
            setFormMsg('Lütfen önce bir hesap seçin.');
            return;
        }
        if (!form.amount || !form.date || !form.categoryId) {
            setFormMsg('Tutar, tarih ve kategori zorunludur.');
            return;
        }
        try {
            // Fotoğraf yükleme hariç, temel transaction ekleme
            await axios.post('/api/transaction', {
                amount: parseFloat(form.amount),
                date: form.date,
                categoryId: parseInt(form.categoryId),
                description: form.description,
                isIncome: form.isIncome,
                accountId: selectedAccountId
            });
            setFormMsg('İşlem başarıyla eklendi!');
            setForm({ amount: '', date: '', categoryId: '', description: '', isIncome: false, receipt: null });
        } catch (err) {
            setFormMsg('İşlem eklenirken hata oluştu.');
        }
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilter(f => ({ ...f, [name]: value }));
    };

    const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewCategory(c => ({ ...c, [name]: value }));
    };
    const handleIconSelect = (icon: string) => setNewCategory(c => ({ ...c, icon }));
    const handleColorSelect = (color: string) => setNewCategory(c => ({ ...c, color }));

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.name) {
            setCatMsg('Kategori adı zorunlu.');
            return;
        }
        try {
            await axios.post('/api/category', {
                name: newCategory.name,
                color: newCategory.color,
                icon: newCategory.icon
            });
            setCatMsg('Kategori eklendi!');
            setNewCategory({ name: '', color: '#764ba2', icon: '🗂️' });
            // Yeniden çek
            const res = await axios.get('/api/category');
            setCategories(res.data);
        } catch {
            setCatMsg('Kategori eklenemedi.');
        }
    };
    const handleDeleteCategory = async (id: number) => {
        try {
            await axios.delete(`/api/category/${id}`);
            setCategories(cats => cats.filter(c => c.id !== id));
        } catch {}
    };

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
                                        <button onClick={() => fetchTransactions(account.id)}>Geçmiş</button>
                                        <button onClick={() => generatePDF(account.id)}>Ekstre</button>
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

                {transactions && selectedAccountId && (
                    <div style={{ marginTop: 30 }}>
                        <h3>📜 İşlem Geçmişi</h3>
                        <ul>
                            {transactions.map(tx => (
                                <li key={tx.id}>
                                    <strong>{tx.transaction_date}</strong> - {tx.description} - {tx.amount.toLocaleString('tr-TR')} ₺
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* MODÜL 3 SEKME ALANI */}
                <div style={{ marginTop: 40 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                        <button onClick={() => setActiveTab('transactions')} style={{ background: activeTab === 'transactions' ? '#764ba2' : '#f1f1f1', color: activeTab === 'transactions' ? 'white' : '#333', padding: '8px 16px', borderRadius: 6, border: 'none' }}>İşlemler</button>
                        <button onClick={() => setActiveTab('categories')} style={{ background: activeTab === 'categories' ? '#764ba2' : '#f1f1f1', color: activeTab === 'categories' ? 'white' : '#333', padding: '8px 16px', borderRadius: 6, border: 'none' }}>Kategori Yönetimi</button>
                        <button onClick={() => setActiveTab('import')} style={{ background: activeTab === 'import' ? '#764ba2' : '#f1f1f1', color: activeTab === 'import' ? 'white' : '#333', padding: '8px 16px', borderRadius: 6, border: 'none' }}>Toplu İçe Aktarma</button>
                        <button onClick={() => setActiveTab('recurring')} style={{ background: activeTab === 'recurring' ? '#764ba2' : '#f1f1f1', color: activeTab === 'recurring' ? 'white' : '#333', padding: '8px 16px', borderRadius: 6, border: 'none' }}>Tekrarlayan İşlemler</button>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 24, minHeight: 200 }}>
                        {activeTab === 'transactions' && (
                            <div>
                                <h3>İşlem Ekle / Düzenle</h3>
                                {/* İşlem ekleme/düzenleme formu buraya gelecek */}
                                <form onSubmit={handleFormSubmit} style={{ margin: '20px 0', padding: 16, background: '#f9f9f9', borderRadius: 6, border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div>
                                        <label>Tutar:</label><br />
                                        <input type="number" name="amount" value={form.amount} onChange={handleFormChange} min="0" step="0.01" required style={{ width: 180 }} />
                                    </div>
                                    <div>
                                        <label>Tarih:</label><br />
                                        <input type="date" name="date" value={form.date} onChange={handleFormChange} required style={{ width: 180 }} />
                                    </div>
                                    <div>
                                        <label>Kategori:</label><br />
                                        <select name="categoryId" value={form.categoryId} onChange={handleFormChange} required style={{ width: 180 }}>
                                            <option value="">Seçiniz</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label>Açıklama:</label><br />
                                        <input type="text" name="description" value={form.description} onChange={handleFormChange} style={{ width: 300 }} />
                                    </div>
                                    <div>
                                        <label>Gelir mi?</label>
                                        <input type="checkbox" name="isIncome" checked={form.isIncome} onChange={handleFormChange} style={{ marginLeft: 8 }} />
                                    </div>
                                    <div>
                                        <label>Fiş Fotoğrafı:</label><br />
                                        <input type="file" name="receipt" accept="image/*" onChange={handleFormChange} />
                                    </div>
                                    <button type="submit" style={{ width: 180, background: '#764ba2', color: 'white', border: 'none', borderRadius: 6, padding: '8px 0', fontWeight: 600 }}>İşlem Ekle</button>
                                    {formMsg && <div style={{ color: formMsg.includes('başarı') ? 'green' : 'red', marginTop: 8 }}>{formMsg}</div>}
                                </form>
                                <h3>İşlem Listesi ve Filtreler</h3>
                                <div style={{ margin: '20px 0', padding: 16, background: '#f9f9f9', borderRadius: 6, border: '1px solid #eee' }}>
                                    <form style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                                        <div>
                                            <label>Tarih (Başlangıç):</label><br />
                                            <input type="date" name="startDate" value={filter.startDate} onChange={handleFilterChange} />
                                        </div>
                                        <div>
                                            <label>Tarih (Bitiş):</label><br />
                                            <input type="date" name="endDate" value={filter.endDate} onChange={handleFilterChange} />
                                        </div>
                                        <div>
                                            <label>Kategori:</label><br />
                                            <select name="categoryId" value={filter.categoryId} onChange={handleFilterChange}>
                                                <option value="">Tümü</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label>Min Tutar:</label><br />
                                            <input type="number" name="minAmount" value={filter.minAmount} onChange={handleFilterChange} min="0" step="0.01" style={{ width: 100 }} />
                                        </div>
                                        <div>
                                            <label>Maks Tutar:</label><br />
                                            <input type="number" name="maxAmount" value={filter.maxAmount} onChange={handleFilterChange} min="0" step="0.01" style={{ width: 100 }} />
                                        </div>
                                        <div>
                                            <label>Açıklama Ara:</label><br />
                                            <input type="text" name="search" value={filter.search} onChange={handleFilterChange} style={{ width: 120 }} />
                                        </div>
                                    </form>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                                            <thead>
                                                <tr style={{ background: '#f1f1f1' }}>
                                                    <th style={{ padding: 8, border: '1px solid #eee' }}>Tarih</th>
                                                    <th style={{ padding: 8, border: '1px solid #eee' }}>Kategori</th>
                                                    <th style={{ padding: 8, border: '1px solid #eee' }}>Açıklama</th>
                                                    <th style={{ padding: 8, border: '1px solid #eee' }}>Tutar</th>
                                                    <th style={{ padding: 8, border: '1px solid #eee' }}>Gelir/Gider</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredTransactions && filteredTransactions.length > 0 ? (
                                                    filteredTransactions.map(tx => {
                                                        const cat = categories.find(c => c.id.toString() === tx.category_id.toString());
                                                        return (
                                                            <tr key={tx.id}>
                                                                <td style={{ padding: 8, border: '1px solid #eee' }}>{tx.transaction_date}</td>
                                                                <td style={{ padding: 8, border: '1px solid #eee' }}>{cat ? `${cat.icon} ${cat.name}` : tx.category_id}</td>
                                                                <td style={{ padding: 8, border: '1px solid #eee' }}>{tx.description}</td>
                                                                <td style={{ padding: 8, border: '1px solid #eee' }}>{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                                <td style={{ padding: 8, border: '1px solid #eee' }}>{tx.amount >= 0 ? (tx.amount > 0 && tx.amount === Math.abs(tx.amount) ? 'Gelir' : 'Gider') : 'Gider'}</td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 16 }}>Kayıt yok.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'categories' && (
                            <div>
                                <h3>Kategori Yönetimi</h3>
                                <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
                                    <div>
                                        <label>Ad:</label><br />
                                        <input name="name" value={newCategory.name} onChange={handleNewCategoryChange} required style={{ width: 120 }} />
                                    </div>
                                    <div>
                                        <label>İkon:</label><br />
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {iconOptions.map(icon => (
                                                <span key={icon} onClick={() => handleIconSelect(icon)} style={{ cursor: 'pointer', fontSize: 22, border: newCategory.icon === icon ? '2px solid #764ba2' : '1px solid #ccc', borderRadius: 4, padding: 2 }}>{icon}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label>Renk:</label><br />
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {colorOptions.map(color => (
                                                <span key={color} onClick={() => handleColorSelect(color)} style={{ cursor: 'pointer', width: 22, height: 22, background: color, display: 'inline-block', borderRadius: '50%', border: newCategory.color === color ? '2px solid #333' : '1px solid #ccc' }}></span>
                                            ))}
                                        </div>
                                    </div>
                                    <button type="submit" style={{ background: '#764ba2', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600 }}>Ekle</button>
                                    {catMsg && <span style={{ color: catMsg.includes('eklendi') ? 'green' : 'red' }}>{catMsg}</span>}
                                </form>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                                        <thead>
                                            <tr style={{ background: '#f1f1f1' }}>
                                                <th style={{ padding: 8, border: '1px solid #eee' }}>İkon</th>
                                                <th style={{ padding: 8, border: '1px solid #eee' }}>Ad</th>
                                                <th style={{ padding: 8, border: '1px solid #eee' }}>Renk</th>
                                                <th style={{ padding: 8, border: '1px solid #eee' }}>Sil</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map(cat => (
                                                <tr key={cat.id}>
                                                    <td style={{ padding: 8, border: '1px solid #eee', fontSize: 20 }}>{cat.icon}</td>
                                                    <td style={{ padding: 8, border: '1px solid #eee' }}>{cat.name}</td>
                                                    <td style={{ padding: 8, border: '1px solid #eee' }}><span style={{ display: 'inline-block', width: 18, height: 18, background: cat.color, borderRadius: '50%' }}></span></td>
                                                    <td style={{ padding: 8, border: '1px solid #eee' }}><button onClick={() => handleDeleteCategory(cat.id)} style={{ background: '#e53935', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Sil</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {activeTab === 'import' && (
                            <div>
                                <h3>Toplu İşlem İçe Aktarma</h3>
                                <div style={{ margin: '20px 0', padding: 16, background: '#f9f9f9', borderRadius: 6, border: '1px solid #eee' }}>
                                    <input type="file" accept=".csv" onChange={handleImportFile} />
                                    {importMsg && <div style={{ color: 'green', marginTop: 8 }}>{importMsg}</div>}
                                    {importedRows.length > 0 && (
                                        <div style={{ marginTop: 20, overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                                                <thead>
                                                    <tr style={{ background: '#f1f1f1' }}>
                                                        {Object.keys(importedRows[0]).map(h => <th key={h} style={{ padding: 8, border: '1px solid #eee' }}>{h}</th>)}
                                                        <th style={{ padding: 8, border: '1px solid #eee' }}>Kategori Eşle</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {importedRows.map((row, idx) => (
                                                        <tr key={idx}>
                                                            {Object.values(row).map((v, i) => <td key={i} style={{ padding: 8, border: '1px solid #eee' }}>{String(v)}</td>)}
                                                            <td style={{ padding: 8, border: '1px solid #eee' }}>
                                                                <select value={row.categoryId || ''} onChange={e => handleImportCategoryChange(idx, e.target.value)}>
                                                                    <option value="">Seçiniz</option>
                                                                    {categories.map(cat => (
                                                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'recurring' && (
                            <div>
                                <h3>Tekrarlayan İşlemler</h3>
                                <form onSubmit={handleAddRecurring} style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
                                    <div>
                                        <label>Tutar:</label><br />
                                        <input type="number" name="amount" value={recForm.amount} onChange={handleRecFormChange} min="0" step="0.01" required style={{ width: 120 }} />
                                    </div>
                                    <div>
                                        <label>Kategori:</label><br />
                                        <select name="categoryId" value={recForm.categoryId} onChange={handleRecFormChange} required style={{ width: 120 }}>
                                            <option value="">Seçiniz</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label>Açıklama:</label><br />
                                        <input type="text" name="description" value={recForm.description} onChange={handleRecFormChange} style={{ width: 180 }} />
                                    </div>
                                    <div>
                                        <label>Başlangıç Tarihi:</label><br />
                                        <input type="date" name="startDate" value={recForm.startDate} onChange={handleRecFormChange} required style={{ width: 140 }} />
                                    </div>
                                    <div>
                                        <label>Sıklık:</label><br />
                                        <select name="frequency" value={recForm.frequency} onChange={handleRecFormChange} style={{ width: 100 }}>
                                            {freqOptions.map(fq => <option key={fq} value={fq}>{fq}</option>)}
                                        </select>
                                    </div>
                                    <button type="submit" style={{ background: '#764ba2', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600 }}>Ekle</button>
                                    {recMsg && <span style={{ color: recMsg.includes('eklendi') ? 'green' : 'red' }}>{recMsg}</span>}
                                </form>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                                        <thead>
                                            <tr style={{ background: '#f1f1f1' }}>
                                                <th style={{ padding: 8, border: '1px solid #eee' }}>Tutar</th>
                                                <th style={{ padding: 8, border: '1px solid #eee' }}>Kategori</th>
                                                <th style={{ padding: 8, border: '1px solid #eee' }}>Açıklama</th>
                                                <th style={{ padding: 8, border: '1px solid #eee' }}>Başlangıç</th>
                                                <th style={{ padding: 8, border: '1px solid #eee' }}>Sıklık</th>
                                                <th style={{ padding: 8, border: '1px solid #eee' }}>Sil</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recurrings.length > 0 ? (
                                                recurrings.map(r => {
                                                    const cat = categories.find(c => c.id.toString() === r.categoryId.toString());
                                                    return (
                                                        <tr key={r.id}>
                                                            <td style={{ padding: 8, border: '1px solid #eee' }}>{r.amount}</td>
                                                            <td style={{ padding: 8, border: '1px solid #eee' }}>{cat ? `${cat.icon} ${cat.name}` : r.categoryId}</td>
                                                            <td style={{ padding: 8, border: '1px solid #eee' }}>{r.description}</td>
                                                            <td style={{ padding: 8, border: '1px solid #eee' }}>{r.startDate}</td>
                                                            <td style={{ padding: 8, border: '1px solid #eee' }}>{r.frequency}</td>
                                                            <td style={{ padding: 8, border: '1px solid #eee' }}><button onClick={() => handleDeleteRecurring(r.id)} style={{ background: '#e53935', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Sil</button></td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16 }}>Kayıt yok.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AccountModule;
