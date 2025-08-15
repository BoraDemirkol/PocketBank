import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../supabase';
import './accountModule.css';
import type { Transaction, Category, Account, RecurringTransaction, BankStatementTransaction } from './transactionTypes';
import { apiService } from '../../api';

const TransactionModule: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // JWT Token alma fonksiyonu
    const getJwtToken = async () => {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error getting session:', error);
                return null;
            }
            return session?.access_token || null;
        } catch (error) {
            console.error('Error getting JWT token:', error);
            return null;
        }
    };

    // Component mount olduğunda token'ı localStorage'a kaydet
    useEffect(() => {
        const saveToken = async () => {
            const token = await getJwtToken();
            if (token) {
                localStorage.setItem('token', token);
                console.log('JWT token saved to localStorage');
            }
        };
        saveToken();
    }, []);

    const [activeTab, setActiveTab] = useState<'transactions' | 'categories' | 'import' | 'bank-statement' | 'recurring'>('transactions');
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [form, setForm] = useState({
        amount: '',
        date: '',
        categoryId: '',
        description: '',
        isIncome: false,
        accountId: '',
        receipt: null as File | null, // Added receipt state
    });
    const [formMsg, setFormMsg] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showNewTransactionForm, setShowNewTransactionForm] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState({
        searchTerm: '',
        startDate: '',
        endDate: ''
    });

    // Kategori ekleme formu için state
    const [newCategory, setNewCategory] = useState({
        name: '',
        icon: '🗂️',
        color: '#764ba2'
    });
    const [categoryMsg, setCategoryMsg] = useState<string | null>(null);
    
    // İkon ve renk seçenekleri
    const iconOptions = ['🛒','🍔','🚕','💳','🎁','🗂️','🏥','🎬','✈️','🚗','🏦','📱','💻','🎵','🏃','🍕'];
    const colorOptions = ['#764ba2','#4caf50','#e53935','#ff9800','#2196f3','#9c27b0','#607d8b','#ffeb3b'];
    
    // Bank statement functionality state
    const [bankType, setBankType] = useState('generic');
    const [selectedBankFile, setSelectedBankFile] = useState<File | null>(null);
    const [bankStatementTransactions, setBankStatementTransactions] = useState<BankStatementTransaction[]>([]);
    const [bankStatementMsg, setBankStatementMsg] = useState<string | null>(null);
    
    // Bulk import state
    const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
    const [importedRows, setImportedRows] = useState<Record<string, string>[]>([]);
    const [importMsg, setImportMsg] = useState<string | null>(null);
    const [importMapping, setImportMapping] = useState<{ [key: string]: string }>({});
    
    // Recurring transactions state
    const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([]);
    const [recForm, setRecForm] = useState({
        amount: '',
        description: '',
        categoryId: '',
        startDate: '',
        frequency: 'aylık',
        isIncome: false
    });
    const [recMsg, setRecMsg] = useState<string | null>(null);
    
    // Frequency options for recurring transactions
    const freqOptions = ['günlük', 'haftalık', 'aylık', 'yıllık'];
    
    // Supported fields for mapping
    const supportedFields = [
        { key: 'transaction_date', label: 'Tarih' },
        { key: 'description', label: 'Açıklama' },
        { key: 'amount', label: 'Tutar' },
        { key: 'category', label: 'Kategori' }
    ];
    
    // Keywords for automatic category matching
    const categoryKeywords: { [key: string]: string[] } = {
        'Market': ['market', 'süpermarket', 'migros', 'carrefour', 'bim', 'a101', 'şok', 'gross', 'metro', 'gida', 'gıda', 'süper', 'hyper', 'discount', 'indirim'],
        'Yemek': ['restoran', 'cafe', 'kafe', 'yemek', 'doner', 'döner', 'pizza', 'burger', 'mc', 'kfc', 'subway', 'starbucks', 'dominos', 'papa', 'johns', 'snowy', 'kahve', 'coffee', 'çay', 'cay', 'pastane', 'fırın', 'firin', 'bakery', 'kebap', 'kebab', 'lahmacun', 'pide', 'mantı', 'manti', 'çorba', 'corba', 'salata', 'tatlı', 'tatli', 'dessert'],
        'Online Alışveriş': ['trendyol', 'amazon', 'hepsiburada', 'n11', 'gitti', 'gittigidiyor', 'sahibinden', 'letgo', 'dolap', 'iyzico', 'paytr', 'online', 'e-ticaret', 'eticaret', 'shop', 'store', 'mall', 'avm', 'plaza', 'center'],
        'Ulaşım': ['taksi', 'uber', 'bitaksi', 'otobüs', 'otobus', 'metro', 'tren', 'marmaray', 'metrobus', 'dolmuş', 'dolmus', 'minibus', 'benzin', 'yakıt', 'yakit', 'petrol', 'gas', 'fuel', 'park', 'otopark', 'parking', 'yol', 'toll', 'geçiş', 'gecis', 'köprü', 'kopru', 'tünel', 'tunel', 'otoyol', 'highway', 'istasyon', 'station'],
        'Fatura': ['fatura', 'elektrik', 'su', 'doğalgaz', 'dogalgaz', 'gas', 'internet', 'telefon', 'gsm', 'enerji', 'ısıtma', 'isitma', 'heating', 'water', 'electric', 'phone', 'mobile', 'tel', 'vodafone', 'turkcell', 'türk telekom', 'turk telekom', 'superonline', 'türknet', 'turknet', 'netflix', 'spotify', 'youtube', 'prime', 'disney', 'hbo', 'apple', 'google', 'microsoft', 'adobe', 'office'],
        'Kira': ['kira', 'ev', 'konut', 'apartman', 'mülk', 'mulk', 'emlak', 'gayrimenkul', 'property', 'rent', 'house', 'apartment', 'condo', 'villa', 'residence', 'site', 'mahalle', 'sokak', 'cadde', 'bulvar', 'avenue'],
        'Eğlence': ['sinema', 'tiyatro', 'konser', 'müze', 'muze', 'park', 'oyun', 'game', 'eğlence', 'eglence', 'gezi', 'tatil', 'holiday', 'vacation', 'tur', 'tour', 'seyahat', 'travel', 'hotel', 'otel', 'resort', 'spa', 'wellness', 'fitness', 'gym', 'spor', 'sport', 'yüzme', 'yuzme', 'swimming', 'tenis', 'tennis', 'futbol', 'football', 'basketbol', 'basketball', 'bowling', 'bilardo', 'billiard', 'karting', 'go-kart', 'gokart', 'lunapark', 'funfair', 'aquapark', 'waterpark', 'kayak', 'ski', 'snowboard', 'dağ', 'dag', 'mountain', 'deniz', 'sea', 'plaj', 'beach', 'ada', 'island', 'cruise', 'gemi', 'ship', 'feribot', 'ferry'],
        'Sağlık': ['eczane', 'pharmacy', 'doktor', 'doctor', 'hastane', 'hospital', 'klinik', 'clinic', 'muayene', 'examination', 'tedavi', 'treatment', 'ilaç', 'ilac', 'medicine', 'vitamin', 'supplement', 'dental', 'diş', 'dis', 'göz', 'goz', 'eye', 'kardiyoloji', 'cardiology', 'ortopedi', 'orthopedics', 'fizik', 'physio', 'terapi', 'therapy', 'laboratuvar', 'laboratory', 'test', 'röntgen', 'rontgen', 'x-ray', 'ultrason', 'ultrasound', 'mr', 'tomografi', 'tomography', 'ameliyat', 'surgery', 'operasyon', 'operation', 'acil', 'emergency', 'ambulans', 'ambulance', 'sağlık', 'saglik', 'health'],
        'Eğitim': ['okul', 'school', 'üniversite', 'universite', 'university', 'kolej', 'college', 'ders', 'lesson', 'kurs', 'course', 'eğitim', 'egitim', 'education', 'öğrenci', 'ogrenci', 'student', 'öğretmen', 'ogretmen', 'teacher', 'profesör', 'profesor', 'professor', 'kitap', 'book', 'kütüphane', 'kutuphane', 'library', 'yayın', 'yayin', 'publication', 'dergi', 'magazine', 'gazete', 'newspaper', 'araştırma', 'arastirma', 'research', 'seminer', 'seminar', 'konferans', 'conference', 'workshop', 'atölye', 'atolye', 'laboratuvar', 'laboratory', 'deney', 'experiment', 'proje', 'project'],
        'Giyim': ['giyim', 'clothing', 'tekstil', 'textile', 'kumaş', 'kumas', 'fabric', 'elbise', 'dress', 'pantolon', 'pants', 'gömlek', 'gomlek', 'shirt', 'ceket', 'jacket', 'mont', 'coat', 'kazak', 'sweater', 'tişört', 'tisort', 't-shirt', 'tshirt', 'ayakkabı', 'ayakkabi', 'shoe', 'çanta', 'canta', 'bag', 'çeki', 'ceki', 'wallet', 'cüzdan', 'cuzdan', 'purse', 'saat', 'watch', 'takı', 'taki', 'jewelry', 'mücevher', 'mucevher', 'altın', 'altin', 'gold', 'gümüş', 'gumus', 'silver', 'elmas', 'diamond', 'inci', 'pearl', 'kolye', 'necklace', 'yüzük', 'yuzuk', 'ring', 'küpe', 'kupe', 'earring', 'bilezik', 'bracelet', 'kemer', 'belt', 'kravat', 'tie', 'fular', 'scarf', 'şal', 'sal', 'shawl', 'eldiven', 'glove', 'şapka', 'sapka', 'hat', 'beret', 'bere', 'çorap', 'corap', 'sock', 'iç çamaşır', 'ic camasir', 'underwear', 'mayo', 'swimsuit', 'bikini', 'şort', 'short', 'eşarp', 'esarp', 'headscarf', 'türban', 'turban', 'hijab', 'abaya', 'kıyafet', 'kiyafet', 'outfit', 'kostüm', 'kostum', 'costume', 'uniform', 'üniforma', 'uniforma', 'takım', 'takim', 'suit', 'smokin', 'tuxedo', 'abiyye', 'gown', 'gelinlik', 'wedding', 'damatlık', 'groom', 'bebek', 'baby', 'çocuk', 'cocuk', 'child', 'kadın', 'kadin', 'woman', 'erkek', 'man', 'genç', 'genc', 'young', 'yaşlı', 'yasli', 'elder', 'spor', 'sport', 'casual', 'günlük', 'gunluk', 'daily', 'resmi', 'formal', 'gece', 'night', 'gündüz', 'gunduz', 'day', 'yaz', 'summer', 'kış', 'kis', 'winter', 'ilkbahar', 'spring', 'sonbahar', 'autumn', 'fall'],
        'Elektronik': ['elektronik', 'electronic', 'teknoloji', 'technology', 'bilgisayar', 'computer', 'laptop', 'notebook', 'tablet', 'telefon', 'phone', 'smartphone', 'akıllı', 'akilli', 'smart', 'tv', 'televizyon', 'television', 'monitör', 'monitor', 'ekran', 'screen', 'klavye', 'keyboard', 'fare', 'mouse', 'yazıcı', 'yazici', 'printer', 'tarayıcı', 'tarayici', 'scanner', 'hoparlör', 'hoparlor', 'speaker', 'kulaklık', 'kulaklik', 'headphone', 'mikrofon', 'microphone', 'kamera', 'camera', 'video', 'kayıt', 'kayit', 'recording', 'çekim', 'cekim', 'shooting', 'fotoğraf', 'fotograf', 'photo', 'resim', 'image', 'görüntü', 'goruntu', 'display', 'projeksiyon', 'projection', 'uydu', 'satellite', 'anten', 'antenna', 'modem', 'router', 'switch', 'hub', 'kablo', 'cable', 'adaptör', 'adaptor', 'şarj', 'sarj', 'charge', 'pil', 'battery', 'akü', 'aku', 'accumulator', 'güç', 'guc', 'power', 'enerji', 'energy', 'elektrik', 'electric', 'volt', 'watt', 'amper', 'ampere', 'ohm', 'frekans', 'frequency', 'dalga', 'wave', 'sinyal', 'signal', 'veri', 'data', 'dosya', 'file', 'program', 'yazılım', 'yazilim', 'software', 'uygulama', 'application', 'app', 'sistem', 'system', 'işletim', 'isletim', 'operating', 'windows', 'mac', 'linux', 'android', 'ios', 'iphone', 'ipad', 'ipod', 'apple', 'samsung', 'huawei', 'xiaomi', 'oppo', 'vivo', 'oneplus', 'sony', 'lg', 'panasonic', 'philips', 'sharp', 'toshiba', 'hitachi', 'daewoo', 'beko', 'vestel', 'arcelik', 'profilo', 'altus', 'regal', 'baymak', 'demirdöküm', 'demirdokum', 'vaillant', 'bosch', 'siemens', 'miele', 'whirlpool', 'electrolux', 'candy', 'hoover', 'dyson', 'rowenta', 'braun', 'oral-b', 'oralb', 'oral'],
        'Banka İşlemleri': ['atm', 'nakit', 'cash', 'para', 'money', 'çekim', 'cekim', 'withdrawal', 'yatırım', 'yatirim', 'deposit', 'transfer', 'havale', 'eft', 'iban', 'hesap', 'account', 'banka', 'bank', 'kredi', 'credit', 'kart', 'card', 'pos', 'terminal', 'ödeme', 'odeme', 'payment', 'taksit', 'installment', 'faiz', 'interest', 'komisyon', 'commission', 'masraf', 'expense', 'ücret', 'ucret', 'fee', 'tutar', 'amount', 'bakiye', 'balance', 'müşteri', 'musteri', 'customer', 'şube', 'sube', 'branch', 'merkez', 'center', 'genel', 'general', 'müdürlük', 'mudurluk', 'directorate', 'müdür', 'mudur', 'director'],
        'Gelir': ['maaş', 'maas', 'salary', 'ücret', 'ucret', 'wage', 'gelir', 'income', 'kazanç', 'kazanc', 'earnings', 'ödeme', 'odeme', 'payment', 'tahsilat', 'collection', 'alacak', 'receivable', 'borç', 'borc', 'debt', 'vakıf', 'vakif', 'foundation', 'garanti', 'akbank', 'isbank', 'ziraat', 'yapı', 'yapi', 'yurtiçi', 'yurtici', 'domestic', 'yurtdışı', 'yurtdisi', 'foreign', 'uluslararası', 'uluslararasi', 'international', 'global', 'dünya', 'dunya', 'world', 'euro', 'dolar', 'dollar', 'sterlin', 'pound', 'lira', 'tl', '₺', '$', '€', '£']
    };
    
    // Utility function for category matching
    const matchCategoryByDescription = (description: string): string | null => {
        const lowerDesc = description.toLowerCase();
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword.toLowerCase()))) {
                return category;
            }
        }
        return null;
    };
    
    // Fetch data from .NET Backend API
    const fetchTransactions = useCallback(async () => {
        try {
            const data = await apiService.get('/transactions');
            setTransactions(data || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setTransactions([]);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const data = await apiService.get('/categories');
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        }
    }, []);

    const fetchAccounts = useCallback(async () => {
        try {
            const data = await apiService.get('/accounts');
            const transformedAccounts: Account[] = (data || []).map((account: Record<string, unknown>) => ({
                id: account.id,
                accountName: account.accountName || account.account_name,
                accountType: account.accountType || account.account_type,
                balance: account.balance,
                userId: account.userId || account.user_id
            }));
            
            setAccounts(transformedAccounts);
            if (transformedAccounts.length > 0) {
                setForm(f => ({ ...f, accountId: f.accountId || transformedAccounts[0].id }));
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
            // Create sample accounts on error
            const sampleAccounts: Account[] = [
                { id: '550e8400-e29b-41d4-a716-446655440001', accountName: 'Ana Hesap', accountType: 'checking', balance: 0, userId: user?.id || '' },
                { id: '550e8400-e29b-41d4-a716-446655440002', accountName: 'Tasarruf Hesabı', accountType: 'savings', balance: 0, userId: user?.id || '' }
            ];
            setAccounts(sampleAccounts);
            setForm(f => ({ ...f, accountId: f.accountId || sampleAccounts[0].id }));
        }
    }, [user?.id]);

    const fetchRecurringTransactions = useCallback(async () => {
        try {
            const data = await apiService.get('/recurring-transactions');
            setRecurrings(data || []);
        } catch (error) {
            console.error('Error fetching recurring transactions:', error);
            setRecurrings([]);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
        fetchCategories();
        fetchAccounts();
        fetchRecurringTransactions();
    }, [fetchTransactions, fetchCategories, fetchAccounts, fetchRecurringTransactions]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked, files } = e.target as HTMLInputElement;
        if (type === 'checkbox') {
            setForm(f => ({ ...f, [name]: checked }));
        } else if (type === 'file') {
            setForm(f => ({ ...f, [name]: files?.[0] || null }));
        } else {
            setForm(f => ({ ...f, [name]: value }));
        }
    };

    const handleReceiptUpload = async (): Promise<string | null> => {
        // For now, return null as upload endpoint might not be implemented
        console.log('Receipt upload not implemented yet');
        return null;
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
                receiptUrl = await handleReceiptUpload();
                if (!receiptUrl) {
                    setFormMsg('Fiş yüklenirken hata oluştu.');
                    return;
                }
            }

            // Send date in UTC format (without timezone offset)
            const formatDateForBackend = (dateString: string) => {
                // dateString format: "2025-08-02" (input type="date" format)
                // Use this format directly, don't create Date object
                return dateString;
            };

            await apiService.post('/transactions', {
                amount: form.isIncome ? Math.abs(parseFloat(form.amount)) : -Math.abs(parseFloat(form.amount)),
                transactionDate: formatDateForBackend(form.date),
                categoryId: form.categoryId,
                description: form.description,
                transactionType: form.isIncome ? 'income' : 'expense',
                accountId: form.accountId,
                receiptUrl: receiptUrl
            });
            setFormMsg('İşlem başarıyla eklendi!');
            fetchTransactions();
            setForm({ amount: '', date: '', categoryId: '', description: '', isIncome: false, accountId: form.accountId, receipt: null });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'İşlem eklenirken/güncellenirken hata oluştu.';
            setFormMsg(errorMessage);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await apiService.delete(`/transactions/${id}`);
            setTransactions(txs => txs.filter(t => t.id !== id));
        } catch {
            console.error('Error deleting transaction');
        }
    };

    const handleExportCsv = () => {
        if (filteredTransactions.length === 0) {
            alert('İndirilecek işlem bulunamadı!');
            return;
        }

        const headers = ['Tarih', 'Açıklama', 'Tutar', 'Kategori', 'Hesap'];
        const csvContent = [
            headers.join(','),
            ...filteredTransactions.map(tx => [
                formatDate(tx.transactionDate || null),
                `"${tx.description || ''}"`,
                tx.amount?.toString() || '',
                categories.find(c => c.id === tx.categoryId)?.name || '',
                accounts.find(a => a.id === tx.accountId)?.accountName || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `islemler_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportExcel = () => {
        if (filteredTransactions.length === 0) {
            alert('İndirilecek işlem bulunamadı!');
            return;
        }

        // Excel için CSV formatını kullan (Excel otomatik açabilir)
        const headers = ['Tarih', 'Açıklama', 'Tutar', 'Kategori', 'Hesap'];
        const csvContent = [
            headers.join(','),
            ...filteredTransactions.map(tx => [
                formatDate(tx.transactionDate || null),
                `"${tx.description || ''}"`,
                tx.amount?.toString() || '',
                categories.find(c => c.id === tx.categoryId)?.name || '',
                accounts.find(a => a.id === tx.accountId)?.accountName || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `islemler_${new Date().toISOString().split('T')[0]}.xlsx`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleRefresh = async () => {
        try {
            console.log('Refreshing data...');
            await Promise.all([
                fetchTransactions(),
                fetchCategories(),
                fetchAccounts(),
                fetchRecurringTransactions()
            ]);
            console.log('Data refresh completed');
            // Show a brief success message
            setFormMsg('Veriler yenilendi!');
            setTimeout(() => {
                setFormMsg(null);
            }, 2000);
        } catch (error) {
            console.error('Error refreshing data:', error);
            setFormMsg('Veri yenileme hatası!');
            setTimeout(() => {
                setFormMsg(null);
            }, 3000);
        }
    };

    const handleApplyFilters = () => {
        setAppliedFilters({
            searchTerm,
            startDate,
            endDate
        });
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setAppliedFilters({
            searchTerm: '',
            startDate: '',
            endDate: ''
        });
    };

    // Helper function to format date
    const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return 'N/A';
        
        // If it's already a Date object, convert to string
        if (dateString instanceof Date) {
            return dateString.toLocaleDateString('tr-TR');
        }
        
        // If it's a string, try to parse it
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleDateString('tr-TR');
        } catch {
            return 'Invalid Date';
        }
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.description?.toLowerCase().includes(appliedFilters.searchTerm.toLowerCase()) || 
                             tx.amount?.toString().includes(appliedFilters.searchTerm);
        const matchesStartDate = !appliedFilters.startDate || (tx.transactionDate && tx.transactionDate >= appliedFilters.startDate);
        const matchesEndDate = !appliedFilters.endDate || (tx.transactionDate && tx.transactionDate <= appliedFilters.endDate);
        return matchesSearch && matchesStartDate && matchesEndDate;
    });

    const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewCategory(c => ({ ...c, [name]: value }));
    };
    
    const handleIconSelect = (icon: string) => setNewCategory(c => ({ ...c, icon }));
    const handleColorSelect = (color: string) => setNewCategory(c => ({ ...c, color }));
    
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.name.trim()) {
            setCategoryMsg('Kategori adı zorunlu.');
            return;
        }

        try {
            await apiService.post('/categories', {
                name: newCategory.name,
                color: newCategory.color,
                icon: newCategory.icon
            });
            
            const res = await apiService.get('/categories');
            setCategories(res);
            setNewCategory({ name: '', color: '#764ba2', icon: '🗂️' });
            setCategoryMsg('Kategori başarıyla eklendi!');
        } catch {
            setCategoryMsg('Kategori eklenirken hata oluştu.');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            await apiService.delete(`/categories/${id}`);
            const res = await apiService.get('/categories');
            setCategories(res);
        } catch {
            console.error('Error deleting category');
        }
    };

    // Bank statement functionality
    const handleBankStatementFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const fileExtension = file.name.toLowerCase().split('.').pop();
        
        // Check supported file formats
        if (!['csv', 'txt', 'xlsx', 'xls', 'pdf'].includes(fileExtension || '')) {
            setBankStatementMsg('Desteklenmeyen dosya formatı. Sadece CSV, TXT, Excel ve PDF dosyaları desteklenir.');
            return;
        }
        
        setSelectedBankFile(file);
        setBankStatementMsg('Dosya seçildi. "Ekle" butonuna basarak işlemi başlatın.');
        // Clear previous data
        setBankStatementTransactions([]);
    };

    const handleImportBankTransactions = async () => {
        if (!selectedBankFile) return;
        
        try {
            setBankStatementMsg('Dosya işleniyor...');
            
            const formData = new FormData();
            formData.append('file', selectedBankFile);
            formData.append('bankType', bankType);
            
            const result = await apiService.uploadFile('/transactions/parse-bank-statement', formData);
            
            if (result.success && result.transactions && result.transactions.length > 0) {
                setBankStatementMsg(`${result.count} işlem başarıyla içe aktarıldı.`);
                // Refresh transactions list
                await fetchTransactions();
            } else {
                setBankStatementMsg('Dosyadan işlem bulunamadı.');
            }
        } catch (error) {
            console.error('Bank statement parsing error:', error);
            setBankStatementMsg('Banka hesap özeti işlenirken hata oluştu.');
        }
    };

    const handleClearBankStatement = () => {
        setSelectedBankFile(null);
        setBankStatementTransactions([]);
        setBankStatementMsg(null);
        // Clear the file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Bulk import handlers
    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const fileExtension = file.name.toLowerCase().split('.').pop();
        
        // Check supported file formats
        if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
            setImportMsg('Desteklenmeyen dosya formatı. Sadece CSV ve Excel dosyaları desteklenir.');
            return;
        }
        
        setSelectedImportFile(file);
        setImportMsg('Dosya seçildi. "Dosyayı Yükle" butonuna basarak işlemi başlatın.');
        setImportedRows([]);
    };

    const handleImportTransactions = async () => {
        if (!selectedImportFile) {
            setImportMsg('Lütfen önce bir dosya seçin.');
            return;
        }

        try {
            setImportMsg('Dosya işleniyor...');
            const fileExtension = selectedImportFile.name.toLowerCase().split('.').pop();
            
            if (fileExtension === 'csv') {
                // CSV dosyası okuma
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const text = evt.target?.result as string;
                    const lines = text.split('\n').filter(Boolean);
                    const headers = lines[0].split(',').map(h => h.trim());
                    
                    // Automatic mapping
                    const autoMapping: { [key: string]: string } = {};
                    headers.forEach(h => {
                      if (/tarih|date/i.test(h)) autoMapping[h] = 'transaction_date';
                      else if (/açıklama|description/i.test(h)) autoMapping[h] = 'description';
                      else if (/tutar|amount/i.test(h)) autoMapping[h] = 'amount';
                      else if (/kategori|category/i.test(h)) autoMapping[h] = 'category';
                      else autoMapping[h] = '';
                    });
                        
                    // Find description column for automatic category matching
                    const descriptionColumn = headers.find(h => /açıklama|description/i.test(h));
                    setImportMapping(autoMapping);
                    
                    // Read rows and match categories automatically
                    const rows = lines.slice(1).map(line => {
                        const values = line.split(',');
                        const row: Record<string, string> = {};
                        headers.forEach((h, i) => row[h] = values[i]?.trim());
                        
                        // If description column exists and category column is empty, match automatically
                        if (descriptionColumn && row[descriptionColumn] && !row['Kategori'] && !row['category']) {
                            const matchedCategory = matchCategoryByDescription(row[descriptionColumn]);
                            if (matchedCategory) {
                                row['Otomatik_Kategori'] = matchedCategory;
                            }
                        }
                        
                        return row;
                    });
                    setImportedRows(rows);
                    setImportMsg(`${rows.length} satır yüklendi. Veritabanına eklemek için tekrar "Ekle" butonuna basın.`);
                };
                reader.readAsText(selectedImportFile);
            } else {
                setImportMsg('Excel dosyaları için backend desteği gerekli. Şimdilik sadece CSV dosyaları desteklenir.');
            }
        } catch (error) {
            console.error('File processing error:', error);
            setImportMsg('Dosya işlenirken hata oluştu.');
        }
    };

    const handleImportTransactionsToDatabase = async () => {
        if (importedRows.length === 0) {
            setImportMsg('İşlenecek veri bulunamadı.');
            return;
        }
        
        try {
            setImportMsg('İşlemler veritabanına ekleniyor...');
            let successCount = 0;
            let errorCount = 0;
            
            for (const row of importedRows) {
                try {
                    const dateField = Object.keys(importMapping).find(key => importMapping[key] === 'transaction_date');
                    const descriptionField = Object.keys(importMapping).find(key => importMapping[key] === 'description');
                    const amountField = Object.keys(importMapping).find(key => importMapping[key] === 'amount');
                    const categoryField = Object.keys(importMapping).find(key => importMapping[key] === 'category');
                    
                    if (!dateField || !descriptionField || !amountField) {
                        errorCount++;
                        continue;
                    }
                    
                    const date = row[dateField];
                    const description = row[descriptionField];
                    const amountStr = row[amountField];
                    const categoryName = categoryField ? row[categoryField] : null;
                    const finalCategoryName = categoryName || row['Otomatik_Kategori'] || categories[0]?.name;
                    
                    if (!date || !description || !amountStr) {
                        errorCount++;
                        continue;
                    }
                    
                    // Find category by name
                    const category = categories.find(c => c.name === finalCategoryName);
                    if (!category) {
                        errorCount++;
                        continue;
                    }
                    
                    // Create transaction
                    await apiService.post('/transactions', {
                        amount: -Math.abs(parseFloat(amountStr)), // Negative for expense
                        transactionDate: date,
                        categoryId: category.id,
                        description: description,
                        accountId: form.accountId || accounts[0]?.id,
                        transactionType: 'expense'
                    });
                    
                    successCount++;
                } catch (error) {
                    console.error('Error importing row:', error);
                    errorCount++;
                }
            }
            
            setImportMsg(`${successCount} işlem başarıyla eklendi. ${errorCount} hata.`);
            if (successCount > 0) {
                await fetchTransactions();
            }
        } catch (error) {
            console.error('Import error:', error);
            setImportMsg('İçe aktarma sırasında hata oluştu.');
        }
    };

    const handleClearImport = () => {
        setSelectedImportFile(null);
        setImportedRows([]);
        setImportMsg(null);
        setImportMapping({});
        // Clear the file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    // Recurring transactions handlers
    const handleRecFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        if (type === 'checkbox') {
            setRecForm(f => ({ ...f, [name]: checked }));
        } else {
            setRecForm(f => ({ ...f, [name]: value }));
        }
    };

    const handleAddRecurring = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recForm.amount || !recForm.categoryId || !recForm.startDate) {
            setRecMsg('Tutar, kategori ve başlangıç tarihi zorunlu.');
            return;
        }
        
        try {
            const recurringData = {
                userId: user?.id || '', // Add missing userId
                description: recForm.description || `Tekrarlayan: ${recForm.amount} ₺`,
                amount: recForm.isIncome ? Math.abs(parseFloat(recForm.amount)) : -Math.abs(parseFloat(recForm.amount)),
                categoryId: recForm.categoryId,
                accountId: form.accountId || accounts[0]?.id,
                startDate: recForm.startDate,
                frequency: recForm.frequency,
                isIncome: recForm.isIncome,
                isActive: true
            };
            
            console.log('Sending recurring transaction data:', JSON.stringify(recurringData, null, 2));
            console.log('Detailed data:', {
                description: recurringData.description,
                amount: recurringData.amount,
                categoryId: recurringData.categoryId,
                accountId: recurringData.accountId,
                startDate: recurringData.startDate,
                frequency: recurringData.frequency,
                isIncome: recurringData.isIncome,
                isActive: recurringData.isActive
            });
            
            // Send to backend (assuming endpoint exists)
            await apiService.post('/recurring-transactions', recurringData);
            
            // Re-fetch recurring transactions
            await fetchRecurringTransactions();
            
            setRecForm({ amount: '', description: '', categoryId: '', startDate: '', frequency: 'aylık', isIncome: false });
            setRecMsg('Tekrarlayan işlem eklendi!');
        } catch (error) {
            console.error('Error adding recurring transaction:', error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
            setRecMsg(`Tekrarlayan işlem eklenirken hata oluştu: ${errorMessage}`);
        }
    };

    const handleDeleteRecurring = async (id: string) => {
        try {
            // Delete from backend (assuming endpoint exists)
            await apiService.delete(`/recurring-transactions/${id}`);
            
            // Re-fetch recurring transactions
            await fetchRecurringTransactions();
        } catch (error) {
            console.error('Error deleting recurring transaction:', error);
            alert('Tekrarlayan işlem silinirken hata oluştu.');
        }
    };

    // New state for similar categories
    const [similarCategories, setSimilarCategories] = useState<Category[][]>([]);

    const handleFindSimilarCategories = async () => {
        if (categories.length < 2) {
            alert('En az iki kategori gereklidir.');
            return;
        }

        try {
            const response = await apiService.get('/categories/similar');
            if (response && response.similarGroups) {
                setSimilarCategories(response.similarGroups);
            } else {
                setSimilarCategories([]);
            }
        } catch (error) {
            console.error('Error finding similar categories:', error);
            alert('Benzer kategoriler bulunurken hata oluştu.');
        }
    };

    const handleMergeCategories = async (categoryIds: string[]) => {
        if (categoryIds.length < 2) {
            alert('En az iki kategori gereklidir.');
            return;
        }

        try {
            await apiService.post('/categories/merge', { categoryIds: categoryIds });
            // Refresh categories after merging
            await fetchCategories();
            setSimilarCategories([]); // Clear similar categories after merging
            alert('Kategoriler başarıyla birleştirildi.');
        } catch (error) {
            console.error('Error merging categories:', error);
            alert('Kategoriler birleştirilirken hata oluştu.');
        }
    };

    return (
        <div className="transaction-module">
            {/* Header */}
            <div className="transaction-header">
                <div className="header-left">
                    <h1 className="header-title">İşlem Yönetimi</h1>
                </div>
                <div className="header-actions">
                    <button className="action-btn" onClick={handleExportCsv}>
                        <span className="action-icon">📄</span>
                        CSV İndir
                    </button>
                    <button className="action-btn" onClick={handleExportExcel}>
                        <span className="action-icon">📊</span>
                        Excel İndir
                    </button>
                    <button className="action-btn" onClick={handleRefresh}>
                        <span className="action-icon">🔄</span>
                        Yenile
                    </button>
                    <button className="action-btn dashboard-btn" onClick={() => navigate('/dashboard')}>
                        <span className="action-icon">←</span>
                        Dashboard'a Dön
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="transaction-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transactions')}
                >
                    İşlemler
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                >
                    Kategoriler
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
                    onClick={() => setActiveTab('import')}
                >
                    Toplu İçe Aktar
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'bank-statement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bank-statement')}
                >
                    Banka Hesap Özeti
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'recurring' ? 'active' : ''}`}
                    onClick={() => setActiveTab('recurring')}
                >
                    Tekrarlayan İşlemler
                </button>
            </div>

            {/* Main Content */}
            <div className="transaction-content">
                {activeTab === 'transactions' && (
                    <div className="transactions-tab">
                        {/* Filters */}
                        <div className="filters-section">
                            <div className="filter-group">
                                <div className="filter-input-wrapper">
                                    <label className="filter-label">Açıklama</label>
                                    <input
                                        type="text"
                                        placeholder="Açıklama ara..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                </div>
                                <div className="filter-input-wrapper">
                                    <label className="filter-label">Başlangıç Tarihi</label>
                                    <input
                                        type="date"
                                        placeholder="Başlangıç tarihi"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="date-input"
                                    />
                                </div>
                                <div className="filter-input-wrapper">
                                    <label className="filter-label">Bitiş Tarihi</label>
                                    <input
                                        type="date"
                                        placeholder="Bitiş tarihi"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="date-input"
                                    />
                                </div>
                                <button 
                                    className="filter-btn apply-btn"
                                    onClick={handleApplyFilters}
                                >
                                    <span className="btn-icon">🔍</span>
                                    Ara
                                </button>
                                <button 
                                    className="filter-btn clear-btn"
                                    onClick={handleClearFilters}
                                >
                                    <span className="btn-icon">🗑️</span>
                                    Temizle
                                </button>
                            </div>
                            <button 
                                className="new-transaction-btn"
                                onClick={() => setShowNewTransactionForm(!showNewTransactionForm)}
                            >
                                <span className="btn-icon">➕</span>
                                Yeni İşlem
                            </button>
                        </div>

                        {/* New Transaction Form */}
                        {showNewTransactionForm && (
                            <div className="new-transaction-form">
                                <form onSubmit={handleFormSubmit}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Tutar</label>
                                            <input 
                                                type="number" 
                                                name="amount" 
                                                value={form.amount} 
                                                onChange={handleFormChange} 
                                                min="0" 
                                                step="0.01" 
                                                required 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Tarih</label>
                                            <input 
                                                type="date" 
                                                name="date" 
                                                value={form.date} 
                                                onChange={handleFormChange} 
                                                required 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Hesap</label>
                                            <select name="accountId" value={form.accountId} onChange={handleFormChange} required>
                                                <option value="">Seçiniz</option>
                                                {accounts.map(account => (
                                                    <option key={account.id} value={account.id}>{account.accountName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Kategori</label>
                                            <select name="categoryId" value={form.categoryId} onChange={handleFormChange} required>
                                                <option value="">Seçiniz</option>
                                                {categories.map(cat => (
                                                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group full-width">
                                            <label>Açıklama</label>
                                            <input 
                                                type="text" 
                                                name="description" 
                                                value={form.description} 
                                                onChange={handleFormChange} 
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>İşlem Türü</label>
                                            <div className="transaction-type-group">
                                                <label className="transaction-type-label">
                                                    <input 
                                                        type="radio" 
                                                        name="isIncome" 
                                                        value="false" 
                                                        checked={!form.isIncome} 
                                                        onChange={() => setForm(f => ({ ...f, isIncome: false }))}
                                                        className="transaction-type-radio"
                                                    />
                                                    <span className="transaction-type-indicator expense">
                                                        ▼
                                                    </span>
                                                    <span className="transaction-type-text">Gider</span>
                                                </label>
                                                <label className="transaction-type-label">
                                                    <input 
                                                        type="radio" 
                                                        name="isIncome" 
                                                        value="true" 
                                                        checked={form.isIncome} 
                                                        onChange={() => setForm(f => ({ ...f, isIncome: true }))}
                                                        className="transaction-type-radio"
                                                    />
                                                    <span className="transaction-type-indicator income">
                                                        ▲
                                                    </span>
                                                    <span className="transaction-type-text">Gelir</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-actions">
                                        <button type="submit" className="submit-btn">İşlem Ekle</button>
                                        <button type="button" className="cancel-btn" onClick={() => setShowNewTransactionForm(false)}>İptal</button>
                                    </div>
                                    {formMsg && <div className={`form-message ${formMsg.includes('başarı') ? 'success' : 'error'}`}>{formMsg}</div>}
                                </form>
                            </div>
                        )}

                        {/* Transactions Table */}
                        <div className="transactions-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tarih</th>
                                        <th>Açıklama</th>
                                        <th>Tutar</th>
                                        <th>Kategori</th>
                                        <th>Hesap</th>
                                        <th>İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody>
                                                                         {filteredTransactions.length > 0 ? (
                                         filteredTransactions.map((tx) => {
                                             const cat = categories.find(c => c.id === tx.categoryId);
                                             const account = accounts.find(a => a.id === tx.accountId);
                                                                                          return (
                                                  <tr key={tx.id}>
                                                                                                             <td>{formatDate(tx.transactionDate || null)}</td>
                                                      <td>{tx.description}</td>
                                                      <td className={`amount ${tx.amount >= 0 ? 'income' : 'expense'}`}>
                                                          {Math.abs(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                      </td>
                                                      <td>{cat ? `${cat.icon} ${cat.name}` : 'Kategori yok'}</td>
                                                      <td>{account?.accountName || 'Hesap yok'}</td>
                                                      <td>
                                                          <button 
                                                              className="delete-btn"
                                                              onClick={() => handleDelete(tx.id)}
                                                          >
                                                              🗑️
                                                          </button>
                                                      </td>
                                                  </tr>
                                              );
                                         })
                                     ) : (
                                        <tr>
                                            <td colSpan={6} className="no-data">
                                                <div className="no-data-content">
                                                    <span className="no-data-icon">📁</span>
                                                    <span>No data</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'categories' && (
                    <div className="categories-tab">
                        <div className="categories-header">
                            <h3>Kategori Yönetimi</h3>
                            <button 
                                className="category-add-btn secondary"
                                onClick={handleFindSimilarCategories}
                            >
                                🔍 Benzer Kategorileri Bul
                            </button>
                        </div>
                        
                        {similarCategories.length > 0 && (
                            <div className="similar-categories-section">
                                <h4>⚠️ Benzer Kategoriler Bulundu</h4>
                                <p>Bu kategoriler birleştirilebilir:</p>
                                {similarCategories.map((group, groupIndex) => (
                                    <div key={groupIndex} className="similar-group">
                                        <div className="similar-group-header">
                                            <span>Grup {groupIndex + 1}:</span>
                                            <button 
                                                className="category-add-btn small"
                                                onClick={() => handleMergeCategories(group.map(c => c.id))}
                                            >
                                                🔗 Birleştir
                                            </button>
                                        </div>
                                        <div className="similar-categories-list">
                                            {group.map(cat => (
                                                <span key={cat.id} className="similar-category-item">
                                                    {cat.icon} {cat.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <form
                            onSubmit={handleAddCategory}
                            className="category-form"
                        >
                            <div className="category-form-row">
                                <div className="category-form-group">
                                    <label>Ad:</label>
                                    <input 
                                        name="name" 
                                        value={newCategory.name} 
                                        onChange={handleNewCategoryChange} 
                                        required 
                                    />
                                </div>
                                <div className="category-form-group">
                                    <label>İkon:</label>
                                    <div className="icon-grid">
                                        {iconOptions.map(icon => (
                                            <span 
                                                key={icon} 
                                                onClick={() => handleIconSelect(icon)} 
                                                className={`icon-option ${newCategory.icon === icon ? 'selected' : ''}`}
                                            >
                                                {icon}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="category-form-group">
                                    <label>Renk:</label>
                                    <div className="color-picker">
                                        {colorOptions.map(color => (
                                            <span 
                                                key={color} 
                                                onClick={() => handleColorSelect(color)} 
                                                className={`color-option ${newCategory.color === color ? 'selected' : ''}`}
                                                style={{ background: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="category-add-btn">Ekle</button>
                            </div>
                            {categoryMsg && <span className={`margin-top-12 ${categoryMsg.includes('başarı') ? 'success-text' : 'error-text'}`}>{categoryMsg}</span>}
                        </form>
                        <div className="overflow-auto margin-top-20">
                            <table className="category-table">
                                <thead>
                                    <tr>
                                        <th>İkon</th>
                                        <th>Ad</th>
                                        <th>Renk</th>
                                        <th>Sil</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((cat) => (
                                        <tr key={cat.id}>
                                            <td className="text-center font-size-20">{cat.icon || '❓'}</td>
                                            <td className="text-center">{cat.name}</td>
                                            <td className="text-center">
                                                <span className="bg-color-circle" style={{ background: cat.color || '#ccc' }} />
                                            </td>
                                            <td className="text-center">
                                                <button 
                                                    onClick={() => handleDeleteCategory(cat.id)} 
                                                    className="category-add-btn danger"
                                                >
                                                    Sil
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'import' && (
                    <div className="import-tab">
                        <h3>Toplu İşlem İçe Aktarma</h3>
                        <div className="import-container">
                            <div className="margin-bottom-16">
                                <label>Dosya Seçin:</label><br />
                                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImportFile} />
                                <div className="file-info">
                                    Desteklenen formatlar: CSV, Excel (.xlsx, .xls)
                                </div>
                            </div>
                            {importMsg && <div className={`margin-top-8 ${importMsg.includes('başarı') ? 'success-text' : 'error-text'}`}>{importMsg}</div>}
                            <div className="button-group margin-top-8">
                                <button 
                                    className="category-add-btn width-120" 
                                    onClick={handleImportTransactions}
                                    disabled={!selectedImportFile}
                                >
                                    Dosyayı Yükle
                                </button>
                                <button 
                                    className="category-add-btn width-120" 
                                    onClick={handleImportTransactionsToDatabase}
                                    disabled={importedRows.length === 0}
                                >
                                    Ekle
                                </button>
                                <button 
                                    className="category-add-btn danger width-120" 
                                    onClick={handleClearImport}
                                    disabled={importedRows.length === 0}
                                >
                                    Temizle
                                </button>
                            </div>

                            {importedRows.length > 0 && (
                                <div className="overflow-auto margin-top-20">
                                    <table className="import-table">
                                        <thead>
                                            <tr>
                                                {supportedFields.map(f => <th key={f.key}>{f.label}</th>)}
                                                <th className="bg-primary-light">Otomatik Kategori</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {importedRows.map((row, idx) => (
                                                <tr key={idx}>
                                                    {supportedFields.map(f => {
                                                        const header = Object.keys(importMapping).find(h => importMapping[h] === f.key);
                                                        return <td key={f.key}>{header ? row[header] : ''}</td>;
                                                    })}
                                                    <td className="bg-primary-light font-weight-bold">
                                                        {row['Otomatik_Kategori'] ? (
                                                            <span className="success-text">✅ {row['Otomatik_Kategori']}</span>
                                                        ) : (
                                                            <span className="error-text">❌ Eşleşme yok</span>
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
                    <div className="bank-statement-tab">
                        <h3>Banka Hesap Özeti İçe Aktarma</h3>
                        <div className="bank-statement-container">
                            <div className="margin-bottom-16">
                                <label>Banka Seçin:</label><br />
                                <select 
                                    value={bankType} 
                                    onChange={(e) => setBankType(e.target.value)}
                                >
                                    <option value="generic">Genel Format</option>
                                    <option value="garanti">Garanti Bankası</option>
                                    <option value="akbank">Akbank</option>
                                    <option value="isbank">İş Bankası</option>
                                    <option value="ziraat">Ziraat Bankası</option>
                                </select>
                            </div>
                            <div className="margin-bottom-16">
                                <label>Banka Hesap Özeti Dosyası:</label><br />
                                <input type="file" accept=".csv,.txt,.xlsx,.xls,.pdf" onChange={handleBankStatementFile} />
                                <div className="file-info">
                                    Desteklenen formatlar: CSV, TXT, Excel (.xlsx, .xls), PDF
                                </div>
                            </div>
                            <div className="margin-bottom-16">
                                <button 
                                    onClick={handleImportBankTransactions}
                                    disabled={!selectedBankFile}
                                    className="category-add-btn margin-right-8"
                                >
                                    Ekle
                                </button>
                                <button 
                                    onClick={handleClearBankStatement}
                                    className="category-add-btn danger margin-right-8"
                                >
                                    Temizle
                                </button>
                                {bankStatementMsg && (
                                    <span className={`${bankStatementMsg.includes('başarı') ? 'success-text' : 'error-text'} margin-left-12`}>
                                        {bankStatementMsg}
                                    </span>
                                )}
                            </div>
                            {bankStatementTransactions.length > 0 && (
                                <div>
                                    <h4>Okunan İşlemler ({bankStatementTransactions.length})</h4>
                                    <div className="overflow-auto margin-top-12">
                                        <table className="bank-statement-table">
                                            <thead>
                                                <tr>
                                                    <th>Tarih</th>
                                                    <th>Açıklama</th>
                                                    <th>Tutar</th>
                                                    <th>Kategori</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bankStatementTransactions.map((tx, idx) => {
                                                    return (
                                                        <tr key={idx}>
                                                            <td>{formatDate(tx.date || null)}</td>
                                                            <td>{tx.description}</td>
                                                            <td>{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                            <td className="bg-primary-light font-weight-bold">
                                                                <span className="success-text">✅ {tx.category}</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'recurring' && (
                    <div className="recurring-tab">
                        <form onSubmit={handleAddRecurring} className="recurring-form">
                            <div className="recurring-form-group">
                                <label>Tutar</label>
                                <input type="number" name="amount" value={recForm.amount} onChange={handleRecFormChange} min="0" step="0.01" required />
                            </div>
                            <div className="recurring-form-group">
                                <label>Kategori</label>
                                <select name="categoryId" value={recForm.categoryId} onChange={handleRecFormChange} required>
                                    <option value="">Seçiniz</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="recurring-form-group">
                                <label>Açıklama</label>
                                <input type="text" name="description" value={recForm.description} onChange={handleRecFormChange} />
                            </div>
                            <div className="recurring-form-group">
                                <label>Başlangıç Tarihi</label>
                                <input type="date" name="startDate" value={recForm.startDate} onChange={handleRecFormChange} required />
                            </div>
                            <div className="recurring-form-group">
                                <label>Sıklık</label>
                                <select name="frequency" value={recForm.frequency} onChange={handleRecFormChange}>
                                    {freqOptions.map(fq => <option key={fq} value={fq}>{fq}</option>)}
                                </select>
                            </div>
                            <div className="recurring-form-group">
                                <label>İşlem Türü</label>
                                <div className="transaction-type-group">
                                    <label className="transaction-type-label">
                                        <input 
                                            type="radio" 
                                            name="isIncome" 
                                            value="false" 
                                            checked={!recForm.isIncome} 
                                            onChange={() => setRecForm(f => ({ ...f, isIncome: false }))}
                                            className="transaction-type-radio"
                                        />
                                        <span className="transaction-type-indicator expense">
                                            ▼
                                        </span>
                                        <span className="transaction-type-text">Gider</span>
                                    </label>
                                    <label className="transaction-type-label">
                                        <input 
                                            type="radio" 
                                            name="isIncome" 
                                            value="true" 
                                            checked={recForm.isIncome} 
                                            onChange={() => setRecForm(f => ({ ...f, isIncome: true }))}
                                            className="transaction-type-radio"
                                        />
                                        <span className="transaction-type-indicator income">
                                            ▲
                                        </span>
                                        <span className="transaction-type-text">Gelir</span>
                                    </label>
                                </div>
                            </div>
                            <button type="submit" className="category-add-btn">Ekle</button>
                            {recMsg && <span className={`${recMsg.includes('eklendi') ? 'success-text' : 'error-text'} margin-left-12`}>{recMsg}</span>}
                        </form>
                        <div className="overflow-auto">
                            <table className="category-table">
                                <thead>
                                    <tr>
                                        <th>Tutar</th>
                                        <th>Kategori</th>
                                        <th>Açıklama</th>
                                        <th>Başlangıç</th>
                                        <th>Sıklık</th>
                                        <th>Tür</th>
                                        <th>Sil</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recurrings.length > 0 ? (
                                        recurrings.map((r) => {
                                            const cat = categories.find(c => c.id.toString() === r.categoryId.toString());
                                            return (
                                                <tr key={r.id}>
                                                    <td className="text-center">
                                                        <span className={r.amount >= 0 ? 'success-text' : 'error-text'}>
                                                            {Math.abs(r.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                                        </span>
                                                    </td>
                                                    <td className="text-center">{cat ? `${cat.icon} ${cat.name}` : 'Kategori yok'}</td>
                                                    <td className="text-center">{r.description}</td>
                                                    <td className="text-center">{formatDate(r.startDate || null)}</td>
                                                    <td className="text-center">{r.frequency}</td>
                                                    <td className="text-center">
                                                        <span className={`${r.isIncome ? 'success-text' : 'error-text'} font-weight-bold`}>
                                                            {r.isIncome ? 'Gelir' : 'Gider'}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <button 
                                                            onClick={() => handleDeleteRecurring(r.id)} 
                                                            className="category-add-btn danger"
                                                        >
                                                            Sil
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr><td colSpan={8} className="text-center padding-16">Kayıt yok.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionModule;
