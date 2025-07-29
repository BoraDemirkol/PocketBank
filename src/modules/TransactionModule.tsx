import React, { useState, useEffect } from 'react';
import Layout from '../context/Layout';
import '../context/accountModule.css';
import axios from 'axios';
import { Transaction, Category, Account, RecurringTransaction } from '../types';

const TransactionModule: React.FC = () => {
    // Modül 3 state ve fonksiyonları
    const [activeTab, setActiveTab] = useState<'transactions' | 'categories' | 'import' | 'bank-statement' | 'recurring'>('transactions');
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
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
    const iconOptions = ['🛒','🍔','🚕','💡','🏠','💳','🎁','📚','🧾','🗂️','🏥','🎬','✈️','🚗','🏦','📱','💻','🎵','🏃','🍕','☕','🎮','📺','🏊','🚴','🎨','📖','🎓','💼','🛍️','🏖️'];
    const colorOptions = ['#764ba2','#4caf50','#e53935','#ff9800','#2196f3','#9c27b0','#607d8b','#ffeb3b'];

    // Toplu içe aktarma için state
    const [importedRows, setImportedRows] = useState<Record<string, string>[]>([]);
    const [importMsg, setImportMsg] = useState<string | null>(null);
    const [importMapping, setImportMapping] = useState<{ [key: string]: string }>({});

    // Banka hesap özeti için state
    const [bankType, setBankType] = useState('generic');
    const [bankStatementTransactions, setBankStatementTransactions] = useState<Array<{
        date: string;
        description: string;
        amount: number;
        category: string;
    }>>([]);
    const [bankStatementMsg, setBankStatementMsg] = useState<string | null>(null);

    // Mapping için desteklenen alanlar:
    const supportedFields = [
      { key: 'transaction_date', label: 'Tarih' },
      { key: 'description', label: 'Açıklama' },
      { key: 'amount', label: 'Tutar' },
      { key: 'category', label: 'Kategori' }
    ];

    // Otomatik kategori eşleştirme için anahtar kelimeler
    const categoryKeywords: { [key: string]: string[] } = {
        'Kira': ['kira', 'ev', 'konut', 'apartman', 'mülk', 'emlak'],
        'Fatura': ['fatura', 'elektrik', 'su', 'doğalgaz', 'internet', 'telefon', 'gsm', 'enerji', 'ısıtma'],
        'Eğlence': ['sinema', 'tiyatro', 'konser', 'müze', 'park', 'oyun', 'eğlence', 'gezi', 'tatil', 'restoran', 'cafe', 'bar'],
        'Ulaşım': ['otobüs', 'metro', 'taksi', 'uber', 'benzin', 'yakıt', 'park', 'otopark', 'yol', 'ulaşım', 'tren'],
        'Market': ['market', 'süpermarket', 'alışveriş', 'gıda', 'yiyecek', 'içecek', 'ekmek', 'süt', 'et', 'sebze', 'meyve']
    };

    // Açıklamaya göre kategori eşleştirme fonksiyonu
    const matchCategoryByDescription = (description: string): string | null => {
        const lowerDesc = description.toLowerCase();
        
        // Varsayılan kategorileri kontrol et
        for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                return categoryName;
            }
        }
        
        // Eşleşme bulunamazsa "Diğer" kategorisini döndür
        return "Diğer";
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const fileExtension = file.name.toLowerCase().split('.').pop();
        
        if (fileExtension === 'csv') {
            // CSV dosyası okuma
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const lines = text.split('\n').filter(Boolean);
            const headers = lines[0].split(',').map(h => h.trim());
            // Otomatik mapping
            const autoMapping: { [key: string]: string } = {};
            headers.forEach(h => {
              if (/tarih|date/i.test(h)) autoMapping[h] = 'transaction_date';
              else if (/açıklama|description/i.test(h)) autoMapping[h] = 'description';
              else if (/tutar|amount/i.test(h)) autoMapping[h] = 'amount';
              else if (/kategori|category/i.test(h)) autoMapping[h] = 'category';
              else autoMapping[h] = '';
            });
                
                // Otomatik kategori eşleştirme için açıklama sütununu bul
                const descriptionColumn = headers.find(h => /açıklama|description/i.test(h));
            setImportMapping(autoMapping);
                // Satırları oku ve otomatik kategori eşleştir
            const rows = lines.slice(1).map(line => {
                const values = line.split(',');
                    const row: Record<string, string> = {};
                headers.forEach((h, i) => row[h] = values[i]?.trim());
                    
                    // Eğer açıklama sütunu varsa ve kategori sütunu boşsa, otomatik eşleştir
                    if (descriptionColumn && row[descriptionColumn] && !row['Kategori'] && !row['category']) {
                        const matchedCategory = matchCategoryByDescription(row[descriptionColumn]);
                        if (matchedCategory) {
                            row['Otomatik_Kategori'] = matchedCategory;
                        }
                    }
                    
                return row;
            });
            setImportedRows(rows);
            setImportMsg(`${rows.length} satır yüklendi.`);
        };
        reader.readAsText(file);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            // Excel dosyası okuma
            try {
                setImportMsg('Excel dosyası işleniyor...');
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await axios.post('/api/parse-excel', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                
                const { headers, rows } = response.data;
                
                // Otomatik mapping
                const autoMapping: { [key: string]: string } = {};
                headers.forEach((h: string) => {
                  if (/tarih|date/i.test(h)) autoMapping[h] = 'transaction_date';
                  else if (/açıklama|description/i.test(h)) autoMapping[h] = 'description';
                  else if (/tutar|amount/i.test(h)) autoMapping[h] = 'amount';
                  else if (/kategori|category/i.test(h)) autoMapping[h] = 'category';
                  else autoMapping[h] = '';
                });
                
                // Otomatik kategori eşleştirme için açıklama sütununu bul
                const descriptionColumn = headers.find((h: string) => /açıklama|description/i.test(h));
                setImportMapping(autoMapping);
                
                // Satırları işle ve otomatik kategori eşleştir
                const processedRows = rows.map((row: Record<string, string>) => {
                    // Eğer açıklama sütunu varsa ve kategori sütunu boşsa, otomatik eşleştir
                    if (descriptionColumn && row[descriptionColumn] && !row['Kategori'] && !row['category']) {
                        const matchedCategory = matchCategoryByDescription(row[descriptionColumn]);
                        if (matchedCategory) {
                            row['Otomatik_Kategori'] = matchedCategory;
                        }
                    }
                    return row;
                });
                
                setImportedRows(processedRows);
                setImportMsg(`${processedRows.length} satır yüklendi.`);
            } catch (error) {
                console.error('Excel parsing error:', error);
                setImportMsg('Excel dosyası işlenirken hata oluştu.');
            }
        } else {
            setImportMsg('Desteklenmeyen dosya formatı. Sadece CSV ve Excel dosyaları desteklenir.');
        }
    };


    // Tekrarlayan işlemler için state
    const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([]);
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
    const handleAddRecurring = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recForm.amount || !recForm.categoryId || !recForm.startDate) {
            setRecMsg('Tutar, kategori ve başlangıç tarihi zorunlu.');
            return;
        }
        
        try {
            // Backend'e gönder
            const response = await axios.post('/api/recurring-transaction', {
                description: recForm.description || `Tekrarlayan: ${recForm.amount} ₺`,
                amount: parseFloat(recForm.amount),
                categoryId: recForm.categoryId,
                accountId: form.accountId || accounts[0]?.id,
                startDate: recForm.startDate,
                frequency: recForm.frequency,
                isIncome: false,
                isActive: true
            });
            
            // Frontend state'ini güncelle
            setRecurrings(prev => [...prev, response.data]);
            
            // Tekrarlayan işlemleri yeniden çek
            await fetchRecurringTransactions();
            
            setRecForm({ amount: '', description: '', categoryId: '', startDate: '', frequency: 'aylık' });
            setRecMsg('Tekrarlayan işlem eklendi!');
        } catch (error) {
            console.error('Error adding recurring transaction:', error);
            setRecMsg('Tekrarlayan işlem eklenirken hata oluştu.');
        }
    };
    const handleDeleteRecurring = async (id: string) => {
        try {
            // Backend'den sil
            await axios.delete(`/api/recurring-transaction/${id}`);
            
            // Frontend state'ini güncelle
            setRecurrings(prev => prev.filter(r => r.id !== id));
            
            // Tekrarlayan işlemleri yeniden çek
            await fetchRecurringTransactions();
        } catch (error) {
            console.error('Error deleting recurring transaction:', error);
            alert('Tekrarlayan işlem silinirken hata oluştu.');
        }
    };

    // İşlemleri API'den çeken fonksiyon
    const fetchTransactions = async () => {
        try {
            const res = await axios.get('/api/transaction');
            setTransactions(res.data);
        } catch (error) {
            // Handle error silently
        }
    };

    // Tekrarlayan işlemleri API'den çeken fonksiyon
    const fetchRecurringTransactions = async () => {
        try {
            const res = await axios.get('/api/recurring-transaction');
            setRecurrings(res.data);
        } catch (error) {
            console.error('Error fetching recurring transactions:', error);
        }
    };

    // Tekrarlayan işlemleri localStorage'a kaydetme fonksiyonu (artık kullanılmıyor)
    // const saveRecurringTransactions = (transactions: RecurringTransaction[]) => {
    //     localStorage.setItem('recurringTransactions', JSON.stringify(transactions));
    // };

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
        
        const fetchAccounts = async () => {
            try {
                const res = await axios.get('/api/account');
                setAccounts(res.data);
                // Set the first account as default if available
                if (res.data.length > 0) {
                    setForm(f => ({ ...f, accountId: f.accountId || res.data[0].id }));
                }
            } catch (err) {
                setAccounts([]);
            }
        };
        
        fetchCategories();
        fetchAccounts();
    }, []);

    // useEffect ile ilk yüklemede işlemleri çek
    useEffect(() => {
        fetchTransactions();
        fetchRecurringTransactions();
    }, []);

    // Filtreleme işlemi
    useEffect(() => {
        if (!transactions) {
            setFilteredTransactions([]);
            return;
        }
        let txs = [...(transactions ?? [])];
        if (filter.startDate) txs = txs.filter(t => {
          const d = t.transactionDate || t.transaction_date || t.date;
          return d ? d >= filter.startDate : false;
        });
        if (filter.endDate) txs = txs.filter(t => {
          const d = t.transactionDate || t.transaction_date || t.date;
          return d ? d <= filter.endDate : false;
        });
        if (filter.categoryId) {
            txs = txs.filter(t => {
                // Check both possible field names for category ID
                const transactionCategoryId = t.categoryId || t.category_id;
                return String(transactionCategoryId) === String(filter.categoryId);
            });
        }
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

    const handleDelete = async (id: string) => {
        await axios.delete(`/api/transaction/${id}`);
        setTransactions(txs => txs.filter(t => t.id !== id));
    };
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.amount || !form.date || !form.categoryId || !form.accountId) {
            setFormMsg('Tutar, tarih, hesap ve kategori zorunludur.');
            return;
        }
        try {
            let receiptUrl: string | null = null;
            
            // Handle receipt upload if file is selected
            if (form.receipt) {
                receiptUrl = await handleReceiptUpload(form.receipt);
                if (!receiptUrl) {
                    setFormMsg('Fiş yüklenirken hata oluştu.');
                    return;
                }
            }

            if (editingId) {
                await axios.put(`/api/transaction/${editingId}`, {
                    amount: Math.abs(parseFloat(form.amount)),
                    date: form.date,
                    categoryId: form.categoryId,
                    description: form.description,
                    isIncome: form.isIncome,
                    accountId: form.accountId,
                    receiptUrl: receiptUrl
                });
                setEditingId(null);
                fetchTransactions();
                setFormMsg('İşlem güncellendi!');
            } else {
                await axios.post('/api/transaction', {
                    amount: Math.abs(parseFloat(form.amount)),
                    date: form.date,
                    categoryId: form.categoryId,
                    description: form.description,
                    isIncome: form.isIncome,
                    accountId: form.accountId,
                    receiptUrl: receiptUrl
                });
                setFormMsg('İşlem başarıyla eklendi!');
                fetchTransactions();
            }
            setForm({ amount: '', date: '', categoryId: '', description: '', isIncome: false, accountId: form.accountId, receipt: null });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'İşlem eklenirken/güncellenirken hata oluştu.';
            setFormMsg(errorMessage);
        }
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
    const handleDeleteCategory = async (id: string) => {
        try {
            await axios.delete(`/api/category/${id}`);
            setCategories(cats => cats.filter(c => c.id !== id));
        } catch (error) {
            console.error('Failed to delete category:', error);
        }
    };

    const handleReceiptUpload = async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await axios.post('/api/upload-receipt', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            return response.data.url;
        } catch (error) {
            console.error('Receipt upload failed:', error);
            return null;
        }
    };

    const handleDownloadReceipt = async (receiptUrl: string) => {
        try {
            // receiptUrl zaten /uploads/filename.jpg formatında geliyor
            console.log('Downloading receipt from:', `http://localhost:5044${receiptUrl}`);
            const response = await axios.get(`http://localhost:5044${receiptUrl}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt-${Date.now()}.${receiptUrl.split('.').pop()}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Receipt download failed:', error);
            alert('Fiş indirilirken hata oluştu.');
        }
    };

    // Dışa aktarma fonksiyonları
    const handleExportCsv = async () => {
        try {
            const response = await axios.get('/api/export/csv', {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `islemler_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('CSV export failed:', error);
            alert('CSV indirilirken hata oluştu.');
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await axios.get('/api/export/excel', {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `islemler_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Excel export failed:', error);
            alert('Excel indirilirken hata oluştu.');
        }
    };

    // Toplu işlem ekleme fonksiyonu
    const handleImportTransactions = async () => {
        if (importedRows.length === 0) return;
        
        try {
            setImportMsg('İşlemler ekleniyor...');
            console.log('Importing transactions:', importedRows);
            
            let successCount = 0;
            let errorCount = 0;
            
            for (const row of importedRows) {
                try {
                    console.log('Processing row:', row);
                    
                    // Gerekli alanları kontrol et
                    const descriptionHeader = Object.keys(importMapping).find(h => importMapping[h] === 'description');
                    const amountHeader = Object.keys(importMapping).find(h => importMapping[h] === 'amount');
                    const dateHeader = Object.keys(importMapping).find(h => importMapping[h] === 'transaction_date');
                    
                    console.log('Headers found:', { descriptionHeader, amountHeader, dateHeader });
                    
                    if (!descriptionHeader || !amountHeader || !dateHeader) {
                        console.error('Missing required headers');
                        errorCount++;
                        continue;
                    }
                    
                    const description = row[descriptionHeader];
                    const amount = row[amountHeader];
                    const date = row[dateHeader];
                    
                    console.log('Values extracted:', { description, amount, date });
                    
                    if (!description || !amount || !date) {
                        console.error('Missing required values');
                        errorCount++;
                        continue;
                    }
                    
                    // Kategori ID'sini bul
                    let categoryId = '';
                    const categoryHeader = Object.keys(importMapping).find(h => importMapping[h] === 'category');
                    if (categoryHeader && row[categoryHeader]) {
                        // Kullanıcının girdiği kategori
                        const categoryName = row[categoryHeader];
                        const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
                        if (category) categoryId = category.id;
                    } else if (row['Otomatik_Kategori']) {
                        // Otomatik eşleştirilen kategori
                        const category = categories.find(c => c.name === row['Otomatik_Kategori']);
                        if (category) categoryId = category.id;
                    }
                    
                    console.log('Category found:', categoryId);
                    
                    // İşlemi ekle
                    const transactionData = {
                        amount: Math.abs(parseFloat(amount)),
                        date: date,
                        categoryId: categoryId || categories[0]?.id, // Varsayılan kategori
                        description: description || 'İçe aktarılan işlem',
                        isIncome: parseFloat(amount) >= 0,
                        accountId: form.accountId || accounts[0]?.id
                    };
                    
                    console.log('Sending transaction data:', transactionData);
                    
                    const response = await axios.post('/api/transaction', transactionData);
                    console.log('Transaction added successfully:', response.data);
                    
                    successCount++;
                } catch (error) {
                    console.error('Error importing transaction:', error);
                    errorCount++;
                }
            }
            
            setImportMsg(`${successCount} işlem başarıyla eklendi. ${errorCount} hata.`);
            setImportedRows([]);
            setImportMapping({});
            
            // İşlemler listesini yenile
            await fetchTransactions();
            
        } catch (error) {
            setImportMsg('Toplu ekleme sırasında hata oluştu.');
            console.error('Import error:', error);
        }
    };

    // Banka hesap özeti işleme fonksiyonları
    const handleBankStatementFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        try {
            setBankStatementMsg('Banka hesap özeti işleniyor...');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bankType', bankType);
            
            const response = await axios.post('/api/parse-bank-statement', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            if (response.data.success) {
                const transactions = response.data.transactions.map((tx: any) => ({
                    date: new Date(tx.date).toLocaleDateString('tr-TR'),
                    description: tx.description,
                    amount: tx.amount,
                    category: tx.category
                }));
                
                setBankStatementTransactions(transactions);
                setBankStatementMsg(`${transactions.length} işlem başarıyla okundu.`);
            } else {
                setBankStatementMsg('Banka hesap özeti işlenirken hata oluştu.');
            }
        } catch (error) {
            console.error('Bank statement parsing error:', error);
            setBankStatementMsg('Banka hesap özeti işlenirken hata oluştu.');
        }
    };

    const handleImportBankTransactions = async () => {
        if (bankStatementTransactions.length === 0) return;
        
        try {
            setBankStatementMsg('İşlemler ekleniyor...');
            let successCount = 0;
            let errorCount = 0;
            
            for (const tx of bankStatementTransactions) {
                try {
                    // Kategori ID'sini bul
                    const category = categories.find(c => c.name === tx.category);
                    const categoryId = category?.id || categories[0]?.id;
                    
                    const transactionData = {
                        amount: Math.abs(tx.amount),
                        date: tx.date,
                        categoryId: categoryId,
                        description: tx.description,
                        isIncome: tx.amount >= 0,
                        accountId: form.accountId || accounts[0]?.id
                    };
                    
                    await axios.post('/api/transaction', transactionData);
                    successCount++;
                } catch (error) {
                    console.error('Error importing bank transaction:', error);
                    errorCount++;
                }
            }
            
            setBankStatementMsg(`${successCount} işlem başarıyla eklendi. ${errorCount} hata.`);
            setBankStatementTransactions([]);
            
            // İşlemler listesini yenile
            await fetchTransactions();
            
        } catch (error) {
            setBankStatementMsg('Banka işlemleri eklenirken hata oluştu.');
            console.error('Bank import error:', error);
        }
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
                        <button onClick={() => setActiveTab('bank-statement')} style={{ background: activeTab === 'bank-statement' ? '#764ba2' : '#f1f1f1', color: activeTab === 'bank-statement' ? 'white' : '#333', padding: '8px 16px', borderRadius: 6, border: 'none' }}>Banka Hesap Özeti</button>
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
                                        <label>Hesap:</label><br />
                                        <select name="accountId" value={form.accountId ?? ''} onChange={handleFormChange} required style={{ width: 180 }}>
                                            <option value="">Seçiniz</option>
                                            {accounts.map(account => (
                                                <option key={account.id} value={account.id}>{account.accountName}</option>
                                            ))}
                                        </select>
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
                                        <label>İşlem Türü:</label><br />
                                        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input 
                                                    type="radio" 
                                                    name="isIncome" 
                                                    value="false" 
                                                    checked={!form.isIncome} 
                                                    onChange={() => setForm(f => ({ ...f, isIncome: false }))}
                                                    style={{ marginRight: 8 }}
                                                />
                                                <span style={{ 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    width: 24, 
                                                    height: 24, 
                                                    borderRadius: '50%', 
                                                    backgroundColor: '#e53935', 
                                                    color: 'white',
                                                    fontSize: 12,
                                                    fontWeight: 'bold'
                                                }}>
                                                    ▼
                                                </span>
                                                <span style={{ marginLeft: 8 }}>Gider</span>
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input 
                                                    type="radio" 
                                                    name="isIncome" 
                                                    value="true" 
                                                    checked={form.isIncome} 
                                                    onChange={() => setForm(f => ({ ...f, isIncome: true }))}
                                                    style={{ marginRight: 8 }}
                                                />
                                                <span style={{ 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    width: 24, 
                                                    height: 24, 
                                                    borderRadius: '50%', 
                                                    backgroundColor: '#4caf50', 
                                                    color: 'white',
                                                    fontSize: 12,
                                                    fontWeight: 'bold'
                                                }}>
                                                    ▲
                                                </span>
                                                <span style={{ marginLeft: 8 }}>Gelir</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label>Fiş Fotoğrafı:</label><br />
                                        <input type="file" name="receipt" accept="image/*" onChange={handleFormChange} />
                                    </div>
                                    <button type="submit" className="category-add-btn" style={{ width: '120px' }}>İşlem Ekle</button>
                                    {formMsg && <div style={{ color: formMsg.includes('başarı') ? 'green' : 'red', marginTop: 8 }}>{formMsg}</div>}
                                </form>
                                <h3>İşlem Listesi ve Filtreler</h3>
                                <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                                    <button 
                                        onClick={handleExportCsv}
                                        style={{ 
                                            background: '#4caf50', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: 4, 
                                            padding: '8px 16px', 
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        📄 CSV İndir
                                    </button>
                                    <button 
                                        onClick={handleExportExcel}
                                        style={{ 
                                            background: '#2196f3', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: 4, 
                                            padding: '8px 16px', 
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        📊 Excel İndir
                                    </button>
                                </div>
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
                                        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#2a2a2a' }}>
                                            <thead>
                                                <tr style={{ background: '#3a3a3a' }}>
                                                    <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Tarih</th>
                                                    <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Kategori</th>
                                                    <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Açıklama</th>
                                                    <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Tutar</th>
                                                    <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Gelir/Gider</th>
                                                    <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Fiş</th>
                                                    <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Sil</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredTransactions && filteredTransactions.length > 0 ? (
                                                    filteredTransactions.map((tx, idx) => {
                                                        const cat = tx.category || categories.find(c => String(c.id) === String(tx.categoryId || tx.category_id));
                                                        const formattedDate = (() => {
                                                            const raw = tx.transactionDate || tx.transaction_date || tx.date || '';
                                                            if (!raw) return '';
                                                            const d = new Date(raw);
                                                            if (isNaN(d.getTime())) return raw;
                                                            const day = String(d.getDate()).padStart(2, '0');
                                                            const month = String(d.getMonth() + 1).padStart(2, '0');
                                                            const year = d.getFullYear();
                                                            return `${day}.${month}.${year}`;
                                                        })();
                                                        return (
                                                            <tr key={tx.id} style={{ background: idx % 2 === 0 ? '#2a2a2a' : '#333' }}>
                                                                <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{formattedDate}</td>
                                                                <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{cat ? `${cat.icon} ${cat.name}` : 'Kategori yok'}</td>
                                                                <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{tx.description}</td>
                                                                <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                                <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{tx.amount >= 0 ? 'Gelir' : 'Gider'}</td>
                                                                <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center' }}>
                                                                    {tx.receiptUrl ? (
                                                                        <button 
                                                                            onClick={() => handleDownloadReceipt(tx.receiptUrl!)}
                                                                            style={{ 
                                                                                background: 'none', 
                                                                                border: 'none', 
                                                                                cursor: 'pointer',
                                                                                fontSize: '16px',
                                                                                color: '#4caf50'
                                                                            }}
                                                                            title="Fişi İndir"
                                                                        >
                                                                            📄
                                                                        </button>
                                                                    ) : (
                                                                        <span style={{ color: '#999', fontSize: '12px' }}>📄</span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center' }}>
                                                                    <button onClick={() => handleDelete(tx.id)} style={{ background: '#e53935', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Sil</button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 16, color: '#fff' }}>Kayıt yok.</td></tr>
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
                                    alignItems: 'flex-end',
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
                                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#2a2a2a' }}>
                                        <thead>
                                            <tr style={{ background: '#3a3a3a' }}>
                                                <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>İkon</th>
                                                <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Ad</th>
                                                <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Renk</th>
                                                <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Sil</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map((cat, idx) => (
                                                <tr key={cat.id} style={{ background: idx % 2 === 0 ? '#2a2a2a' : '#333' }}>
                                                    <td style={{ padding: 8, border: '1px solid #555', fontSize: 20, textAlign: 'center' }}>{cat.icon || '❓'}</td>
                                                    <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{cat.name}</td>
                                                    <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center' }}><span style={{ display: 'inline-block', width: 18, height: 18, background: cat.color || '#ccc', borderRadius: '50%' }}></span></td>
                                                    <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center' }}><button onClick={() => handleDeleteCategory(cat.id)} style={{ background: '#e53935', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Sil</button></td>
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
                                    <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImportFile} />
                                    {importMsg && <div style={{ color: 'green', marginTop: 8 }}>{importMsg}</div>}
                                    {importedRows.length > 0 && (
                                        <button 
                                            className="category-add-btn" 
                                            onClick={handleImportTransactions}
                                            style={{ marginTop: 8 }}
                                        >
                                            İşlemleri Ekle ({importedRows.length} adet)
                                        </button>
                                    )}

                                    {importedRows.length > 0 && (
                                        <div style={{ marginTop: 20, overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#2a2a2a' }}>
                                                <thead>
                                                    <tr style={{ background: '#3a3a3a' }}>
                                                        {supportedFields.map(f => <th key={f.key} style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>{f.label}</th>)}
                                                        <th style={{ padding: 8, border: '1px solid #555', background: '#2d4a2d', color: '#fff' }}>Otomatik Kategori</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {importedRows.map((row, idx) => (
                                                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#2a2a2a' : '#333' }}>
                                                            {supportedFields.map(f => {
                                                                const header = Object.keys(importMapping).find(h => importMapping[h] === f.key);
                                                                return <td key={f.key} style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>{header ? row[header] : ''}</td>;
                                                            })}
                                                            <td style={{ padding: 8, border: '1px solid #555', background: '#1a3a1a', fontWeight: 'bold' }}>
                                                                {row['Otomatik_Kategori'] ? (
                                                                    <span style={{ color: '#4caf50' }}>✅ {row['Otomatik_Kategori']}</span>
                                                                ) : (
                                                                    <span style={{ color: '#ff6b6b' }}>❌ Eşleşme yok</span>
                                                                )}
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
                        {activeTab === 'bank-statement' && (
                            <div>
                                <h3>Banka Hesap Özeti İçe Aktarma</h3>
                                <div className="bank-statement-container" style={{ margin: '20px 0', padding: 16, borderRadius: 6, border: '1px solid #eee' }}>
                                    <div style={{ marginBottom: 16 }}>
                                        <label>Banka Seçin:</label><br />
                                        <select 
                                            value={bankType} 
                                            onChange={(e) => setBankType(e.target.value)}
                                            style={{ width: 200, marginTop: 8 }}
                                        >
                                            <option value="generic">Genel Format</option>
                                            <option value="garanti">Garanti Bankası</option>
                                            <option value="akbank">Akbank</option>
                                            <option value="isbank">İş Bankası</option>
                                            <option value="ziraat">Ziraat Bankası</option>
                                        </select>
                                    </div>
                                    <input type="file" accept=".csv,.txt" onChange={handleBankStatementFile} />
                                    {bankStatementMsg && <div style={{ color: 'green', marginTop: 8 }}>{bankStatementMsg}</div>}
                                    {bankStatementTransactions.length > 0 && (
                                        <button 
                                            className="category-add-btn" 
                                            onClick={handleImportBankTransactions}
                                            style={{ marginTop: 8 }}
                                        >
                                            İşlemleri Ekle ({bankStatementTransactions.length} adet)
                                        </button>
                                    )}

                                    {bankStatementTransactions.length > 0 && (
                                        <div style={{ marginTop: 20, overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#2a2a2a' }}>
                                                <thead>
                                                    <tr style={{ background: '#3a3a3a' }}>
                                                        <th style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>Tarih</th>
                                                        <th style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>Açıklama</th>
                                                        <th style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>Tutar</th>
                                                        <th style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>Otomatik Kategori</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bankStatementTransactions.map((tx, idx) => (
                                                        <tr key={idx} style={{ background: idx % 2 === 0 ? '#2a2a2a' : '#333' }}>
                                                            <td style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>{tx.date}</td>
                                                            <td style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>{tx.description}</td>
                                                            <td style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                            <td style={{ padding: 8, border: '1px solid #555', background: '#1a3a1a', fontWeight: 'bold' }}>
                                                                <span style={{ color: '#4caf50' }}>✅ {tx.category}</span>
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
                                <form onSubmit={handleAddRecurring} style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap' }}>
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
                                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#2a2a2a' }}>
                                        <thead>
                                            <tr style={{ background: '#3a3a3a' }}>
                                                <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Tutar</th>
                                                <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Kategori</th>
                                                <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Açıklama</th>
                                                <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Başlangıç</th>
                                                <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Sıklık</th>
                                                <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Sil</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recurrings.length > 0 ? (
                                                recurrings.map((r, idx) => {
                                                    const cat = categories.find(c => c.id.toString() === r.categoryId.toString());
                                                    return (
                                                        <tr key={r.id} style={{ background: idx % 2 === 0 ? '#2a2a2a' : '#333' }}>
                                                            <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{r.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                            <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{cat ? `${cat.icon} ${cat.name}` : 'Kategori yok'}</td>
                                                            <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{r.description}</td>
                                                            <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{new Date(r.startDate).toLocaleDateString('tr-TR')}</td>
                                                            <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{r.frequency}</td>
                                                            <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center' }}><button onClick={() => handleDeleteRecurring(r.id)} style={{ background: '#e53935', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Sil</button></td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 16, color: '#fff' }}>Kayıt yok.</td></tr>
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