import React, { useState, useEffect } from 'react';
import Layout from '../context/Layout';
import '../context/accountModule.css';
import axios from 'axios';

interface Transaction {
    id: string;
    account_id: string;
    category_id: string;
    amount: number;
    transaction_date: string;
    description: string;
    category?: Category;
    date?: string;
}

interface Category {
    id: number;
    name: string;
    color: string;
    icon: string;
}

const TransactionModule: React.FC = () => {
    // Modül 3 state ve fonksiyonları
    const [activeTab, setActiveTab] = useState<'transactions' | 'categories' | 'import' | 'recurring'>('transactions');
    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState({
        amount: '',
        date: '',
        categoryId: '',
        description: '',
        isIncome: false,
        accountId: '', // her zaman tanımlı
        receipt: null as File | null,
    });
    const [formMsg, setFormMsg] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filter, setFilter] = useState({
        startDate: '',
        endDate: '',
        categoryId: '',
        minAmount: '',
        maxAmount: '',
        search: '',
    });
    const [pendingFilter, setPendingFilter] = useState(filter);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

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
    const [importMapping, setImportMapping] = useState<{ [key: string]: string }>({});
    const [importHeaders, setImportHeaders] = useState<string[]>([]);

    // Mapping için desteklenen alanlar:
    const supportedFields = [
      { key: 'transaction_date', label: 'Tarih' },
      { key: 'description', label: 'Açıklama' },
      { key: 'amount', label: 'Tutar' },
      { key: 'category', label: 'Kategori' }
    ];

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const lines = text.split('\n').filter(Boolean);
            const headers = lines[0].split(',').map(h => h.trim());
            setImportHeaders(headers);
            // Otomatik mapping
            const autoMapping: { [key: string]: string } = {};
            headers.forEach(h => {
              if (/tarih|date/i.test(h)) autoMapping[h] = 'transaction_date';
              else if (/açıklama|description/i.test(h)) autoMapping[h] = 'description';
              else if (/tutar|amount/i.test(h)) autoMapping[h] = 'amount';
              else if (/kategori|category/i.test(h)) autoMapping[h] = 'category';
              else autoMapping[h] = '';
            });
            setImportMapping(autoMapping);
            // Satırları oku
            const rows = lines.slice(1).map(line => {
                const values = line.split(',');
                const row: any = {};
                headers.forEach((h, i) => row[h] = values[i]?.trim());
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

    // İşlemleri API'den çeken fonksiyon
    const fetchTransactions = async () => {
        try {
            const res = await axios.get('/api/transaction');
            setTransactions(res.data);
        } catch (err) {
            setTransactions([]);
        }
    };

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

    // useEffect ile ilk yüklemede işlemleri çek
    useEffect(() => {
        fetchTransactions();
    }, []);

    // Filtreleme işlemi
    useEffect(() => {
        if (!transactions) {
            setFilteredTransactions([]);
            return;
        }
        let txs = [...(transactions ?? [])];
        if (filter.startDate) txs = txs.filter(t => {
          const d = t.transaction_date || t.date;
          return d ? d >= filter.startDate : false;
        });
        if (filter.endDate) txs = txs.filter(t => {
          const d = t.transaction_date || t.date;
          return d ? d <= filter.endDate : false;
        });
        if (filter.categoryId) txs = txs.filter(t => String(t.category_id) === String(filter.categoryId));
        if (filter.minAmount) txs = txs.filter(t => t.amount >= parseFloat(filter.minAmount));
        if (filter.maxAmount) txs = txs.filter(t => t.amount <= parseFloat(filter.maxAmount));
        if (filter.search) txs = txs.filter(t => t.description.toLowerCase().includes(filter.search.toLowerCase()));
        setFilteredTransactions(txs);
    }, [transactions, filter]);

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
    const handleEdit = (tx: Transaction) => {
        setEditingId(tx.id);
        setForm({
            amount: String(tx.amount),
            date: tx.transaction_date,
            categoryId: tx.category_id,
            description: tx.description,
            isIncome: tx.amount >= 0,
            accountId: tx.account_id, // eklendi
            receipt: null
        });
    };
    const handleDelete = async (id: string) => {
        if (!window.confirm('İşlem silinsin mi?')) return;
        await axios.delete(`/api/transaction/${id}`);
        setTransactions(txs => txs.filter(t => t.id !== id));
    };
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.amount || !form.date || !form.categoryId) {
            setFormMsg('Tutar, tarih ve kategori zorunludur.');
            return;
        }
        try {
            if (editingId) {
                await axios.put(`/api/transaction/${editingId}`, {
                    amount: parseFloat(form.amount),
                    date: form.date,
                    categoryId: form.categoryId, // parseInt kaldırıldı
                    description: form.description,
                    isIncome: form.isIncome,
                    accountId: form.accountId
                });
                setEditingId(null);
                fetchTransactions();
                setFormMsg('İşlem güncellendi!');
            } else {
                await axios.post('/api/transaction', {
                    amount: parseFloat(form.amount),
                    date: form.date,
                    categoryId: form.categoryId, // parseInt kaldırıldı
                    description: form.description,
                    isIncome: form.isIncome,
                    accountId: form.accountId
                });
                setFormMsg('İşlem başarıyla eklendi!');
                fetchTransactions();
            }
            setForm({ amount: '', date: '', categoryId: '', description: '', isIncome: false, accountId: '', receipt: null });
        } catch (err) {
            setFormMsg('İşlem eklenirken/güncellenirken hata oluştu.');
        }
    };
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilter(f => ({ ...f, [name]: value }));
    };
    const handlePendingFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPendingFilter(f => ({ ...f, [name]: value }));
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
                <h2 className="module-title">💸 Modül 3: İşlem Yönetimi</h2>
                <div style={{ marginTop: 40 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                        <button onClick={() => setActiveTab('transactions')} style={{ background: activeTab === 'transactions' ? '#764ba2' : '#f1f1f1', color: activeTab === 'transactions' ? 'white' : '#333', padding: '8px 16px', borderRadius: 6, border: 'none' }}>İşlemler</button>
                        <button onClick={() => setActiveTab('categories')} style={{ background: activeTab === 'categories' ? '#764ba2' : '#f1f1f1', color: activeTab === 'categories' ? 'white' : '#333', padding: '8px 16px', borderRadius: 6, border: 'none' }}>Kategori Yönetimi</button>
                        <button onClick={() => setActiveTab('import')} style={{ background: activeTab === 'import' ? '#764ba2' : '#f1f1f1', color: activeTab === 'import' ? 'white' : '#333', padding: '8px 16px', borderRadius: 6, border: 'none' }}>Toplu İçe Aktarma</button>
                        <button onClick={() => setActiveTab('recurring')} style={{ background: activeTab === 'recurring' ? '#764ba2' : '#f1f1f1', color: activeTab === 'recurring' ? 'white' : '#333', padding: '8px 16px', borderRadius: 6, border: 'none' }}>Tekrarlayan İşlemler</button>
                    </div>
                    <div className="module3-tab-content" style={{ borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 24, minHeight: 200 }}>
                        {activeTab === 'transactions' && (
                            <div>
                                <h3>İşlem Ekle / Düzenle</h3>
                                <form onSubmit={handleFormSubmit} style={{ margin: '20px 0', padding: 16, background: '#f9f9f9', borderRadius: 6, border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div>
                                        <label>Tutar:</label><br />
                                        <input type="number" name="amount" value={form.amount ?? ''} onChange={handleFormChange} min="0" step="0.01" required style={{ width: 180 }} />
                                    </div>
                                    <div>
                                        <label>Tarih:</label><br />
                                        <input type="date" name="date" value={form.date ?? ''} onChange={handleFormChange} required style={{ width: 180 }} />
                                    </div>
                                    <div>
                                        <label>Kategori:</label><br />
                                        <select name="categoryId" value={form.categoryId ?? ''} onChange={handleFormChange} required style={{ width: 180 }}>
                                            <option value="">Seçiniz</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label>Açıklama:</label><br />
                                        <input type="text" name="description" value={form.description ?? ''} onChange={handleFormChange} style={{ width: 300 }} />
                                    </div>
                                    <div>
                                        <label>Gelir mi?</label>
                                        <input type="checkbox" name="isIncome" checked={form.isIncome} onChange={handleFormChange} style={{ marginLeft: 8 }} />
                                    </div>
                                    <div>
                                        <label>Fiş Fotoğrafı:</label><br />
                                        <input type="file" name="receipt" accept="image/*" onChange={handleFormChange} />
                                    </div>
                                    <button type="submit" className="category-add-btn">İşlem Ekle</button>
                                    {formMsg && <div style={{ color: formMsg.includes('başarı') ? 'green' : 'red', marginTop: 8 }}>{formMsg}</div>}
                                </form>
                                <h3>İşlem Listesi ve Filtreler</h3>
                                <div className="transaction-list-container" style={{ margin: '20px 0', padding: 16, borderRadius: 6, border: '1px solid #eee' }}>
                                    <form style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }} onSubmit={e => { e.preventDefault(); setFilter(pendingFilter); }}>
                                        <div>
                                            <label>Tarih (Başlangıç):</label><br />
                                            <input type="date" name="startDate" value={pendingFilter.startDate} onChange={handlePendingFilterChange} />
                                        </div>
                                        <div>
                                            <label>Tarih (Bitiş):</label><br />
                                            <input type="date" name="endDate" value={pendingFilter.endDate} onChange={handlePendingFilterChange} />
                                        </div>
                                        <div>
                                            <label>Kategori:</label><br />
                                            <select name="categoryId" value={pendingFilter.categoryId} onChange={handlePendingFilterChange}>
                                                <option value="">Tümü</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label>Min Tutar:</label><br />
                                            <input type="number" name="minAmount" value={pendingFilter.minAmount} onChange={handlePendingFilterChange} min="0" step="0.01" style={{ width: 100 }} />
                                        </div>
                                        <div>
                                            <label>Maks Tutar:</label><br />
                                            <input type="number" name="maxAmount" value={pendingFilter.maxAmount} onChange={handlePendingFilterChange} min="0" step="0.01" style={{ width: 100 }} />
                                        </div>
                                        <div>
                                            <label>Açıklama Ara:</label><br />
                                            <input type="text" name="search" value={pendingFilter.search} onChange={handlePendingFilterChange} style={{ width: 120 }} />
                                        </div>
                                        <button type="submit" className="category-add-btn">Bul</button>
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
                                                    <th style={{ padding: 8, border: '1px solid #eee' }}>İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredTransactions && filteredTransactions.length > 0 ? (
                                                    filteredTransactions.map(tx => {
                                                        const cat = tx.category || categories.find(c => String(c.id) === String(tx.category_id));
                                                        const formattedDate = (() => {
                                                            const raw = tx.transaction_date || tx.date || '';
                                                            if (!raw) return '';
                                                            const d = new Date(raw);
                                                            if (isNaN(d.getTime())) return raw;
                                                            const day = String(d.getDate()).padStart(2, '0');
                                                            const month = String(d.getMonth() + 1).padStart(2, '0');
                                                            const year = d.getFullYear();
                                                            return `${day}.${month}.${year}`;
                                                        })();
                                                        return (
                                                            <tr key={tx.id}>
                                                                <td style={{ padding: 8, border: '1px solid #eee' }}>{formattedDate}</td>
                                                                <td style={{ padding: 8, border: '1px solid #eee' }}>{cat ? `${cat.icon} ${cat.name}` : 'Kategori yok'}</td>
                                                                <td style={{ padding: 8, border: '1px solid #eee' }}>{tx.description}</td>
                                                                <td style={{ padding: 8, border: '1px solid #eee' }}>{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                                <td style={{ padding: 8, border: '1px solid #eee' }}>{tx.amount >= 0 ? (tx.amount > 0 && tx.amount === Math.abs(tx.amount) ? 'Gelir' : 'Gider') : 'Gider'}</td>
                                                                <td style={{ padding: 8, border: '1px solid #eee' }}>
                                                                    <button onClick={() => handleEdit(tx)} style={{ marginRight: 8, background: '#2196f3', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Düzenle</button>
                                                                    <button onClick={() => handleDelete(tx.id)} style={{ background: '#e53935', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Sil</button>
                                                                </td>
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
                            </div>
                        )}
                        {activeTab === 'categories' && (
                            <div>
                                <h3>Kategori Yönetimi</h3>
                                <form
                                  onSubmit={handleAddCategory}
                                  style={{
                                    display: 'flex',
                                    gap: 16,
                                    alignItems: 'center', // <-- burada!
                                    marginBottom: 24,
                                    flexWrap: 'wrap'
                                  }}
                                >
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
                                    <button type="submit" className="category-add-btn">Ekle</button>
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
                                <div className="import-container" style={{ margin: '20px 0', padding: 16, borderRadius: 6, border: '1px solid #eee' }}>
                                    <input type="file" accept=".csv" onChange={handleImportFile} />
                                    {importMsg && <div style={{ color: 'green', marginTop: 8 }}>{importMsg}</div>}
                                    {importedRows.length > 0 && (
                                        <button className="category-add-btn">Ekle</button>
                                    )}
                                    {importedRows.length > 0 && (
                                        <div style={{ margin: '12px 0' }}>
                                            <h4>Sütun Eşleştirme</h4>
                                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                                {importHeaders.map(h => (
                                                    <div key={h}>
                                                        <label>{h}</label><br />
                                                        <select
                                                            value={importMapping[h] || ''}
                                                            onChange={e => setImportMapping(m => ({ ...m, [h]: e.target.value }))}
                                                        >
                                                            <option value=''>Yok</option>
                                                            {supportedFields.map(f => (
                                                                <option key={f.key} value={f.key}>{f.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {importedRows.length > 0 && (
                                        <div style={{ marginTop: 20, overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                                                <thead>
                                                    <tr style={{ background: '#f1f1f1' }}>
                                                        {supportedFields.map(f => <th key={f.key} style={{ padding: 8, border: '1px solid #eee' }}>{f.label}</th>)}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {importedRows.map((row, idx) => (
                                                        <tr key={idx}>
                                                            {supportedFields.map(f => {
                                                                const header = Object.keys(importMapping).find(h => importMapping[h] === f.key);
                                                                return <td key={f.key} style={{ padding: 8, border: '1px solid #eee' }}>{header ? row[header] : ''}</td>;
                                                            })}
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
                                    <button type="submit" className="category-add-btn">Ekle</button>
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

export default TransactionModule; 