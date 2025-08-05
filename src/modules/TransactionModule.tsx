import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Layout from '../context/Layout';
import '../context/accountModule.css';
import { Transaction, Category, Account, RecurringTransaction } from '../types';
import { useSearchParams } from 'react-router-dom';
import { 
    supabaseTransactionService, 
    supabaseCategoryService, 
    supabaseAccountService, 
    supabaseRecurringTransactionService,
    supabaseAuthService 
} from '../services/supabaseService';

// Backend URL'ini ayarla (fallback için)
axios.defaults.baseURL = 'http://localhost:5044';

const TransactionModule: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // URL'den tab parametresini al
    const tabFromUrl = searchParams.get('tab') as 'transactions' | 'categories' | 'import' | 'bank-statement' | 'recurring' | null;
    
    // Modül 3 state ve fonksiyonları
    const [activeTab, setActiveTab] = useState<'transactions' | 'categories' | 'import' | 'bank-statement' | 'recurring'>(tabFromUrl || 'transactions');
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [form, setForm] = useState({
        amount: '',
        date: '',
        categoryId: '',
        description: '',
        isIncome: false,
        accountId: 'default-1', // Varsayılan hesap ID'si
        receipt: null as File | null,
    });
    const [formMsg, setFormMsg] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([]);
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

    // URL'deki tab değişikliklerini dinle
    useEffect(() => {
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
    }, [tabFromUrl]);

    // activeTab değiştiğinde URL'i güncelle
    useEffect(() => {
        if (activeTab !== 'transactions') {
            setSearchParams({ tab: activeTab });
        } else {
            setSearchParams({});
        }
    }, [activeTab, setSearchParams]);

    // Açıklamaya göre kategori eşleştirme fonksiyonu
    const matchCategoryByDescription = (description: string): string | null => {
        const lowerDesc = description.toLowerCase();
        
        // Özel durumlar için öncelikli kontrol
        if (lowerDesc.includes('pos') && lowerDesc.includes('domestic')) {
            // POS işlemleri için daha detaylı analiz
            if (lowerDesc.includes('doner') || lowerDesc.includes('döner') || lowerDesc.includes('snowy') || 
                lowerDesc.includes('kahve') || lowerDesc.includes('gida') || lowerDesc.includes('gıda')) {
                return 'Yemek';
            }
            if (lowerDesc.includes('bim') || lowerDesc.includes('market') || lowerDesc.includes('süpermarket')) {
                return 'Market';
            }
        }
        
        // ATM işlemleri
        if (lowerDesc.includes('atm') && lowerDesc.includes('cash')) {
            return 'Banka İşlemleri';
        }
        
        // Virtual POS işlemleri
        if (lowerDesc.includes('virtual') && lowerDesc.includes('pos')) {
            if (lowerDesc.includes('trendyol') || lowerDesc.includes('amazon')) {
                return 'Online Alışveriş';
            }
        }
        
        // Kira ödemesi için özel kontrol
        if (lowerDesc.includes('kira') && (lowerDesc.includes('ödeme') || lowerDesc.includes('odeme'))) {
            return 'Kira';
        }
        
        // Gelen işlemler (gelir)
        if (lowerDesc.includes('incoming') || lowerDesc.includes('allowance') || lowerDesc.includes('vakıf') || lowerDesc.includes('vakif')) {
            return 'Gelir';
        }
        
        // Varsayılan kategorileri kontrol et (öncelik sırasına göre)
        const priorityCategories = [
            'Online Alışveriş', // Önce online alışveriş kontrol et
            'Yemek',           // Sonra yemek
            'Market',          // Sonra market
            'Ulaşım',          // Sonra ulaşım
            'Fatura',          // Sonra fatura
            'Kira',            // Kira'yı daha yüksek önceliğe taşı
            'Banka İşlemleri', // Sonra banka işlemleri
            'Eğlence',         // Sonra eğlence
            'Sağlık',          // Sonra sağlık
            'Eğitim',          // Sonra eğitim
            'Giyim',           // Sonra giyim
            'Elektronik',      // Sonra elektronik
            'Gelir'            // En son gelir
        ];
        
        for (const categoryName of priorityCategories) {
            const keywords = categoryKeywords[categoryName];
            if (keywords && keywords.some(keyword => lowerDesc.includes(keyword))) {
                return categoryName;
            }
        }
        
        // Eşleşme bulunamazsa null döndür
        return null;
    };

    // Dosya seçimi için state'ler
    const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
    const [selectedBankFile, setSelectedBankFile] = useState<File | null>(null);

    // Mevcut kullanıcı ID'si
    const [currentUserId, setCurrentUserId] = useState<string>('');

    // Mevcut kullanıcıyı getir
    const fetchCurrentUser = async () => {
        try {
            // Önce Supabase'den kullanıcı bilgisini al
            const { user, error } = await supabaseAuthService.getCurrentUser();
            if (error) {
                console.error('Error fetching current user from Supabase:', error);
                // Fallback olarak backend'den dene
                try {
                    const response = await axios.get('/api/current-user');
                    setCurrentUserId(response.data.id);
                } catch (backendError) {
                    console.error('Error fetching from backend:', backendError);
                    // Varsayılan kullanıcı ID'si ayarla
                    setCurrentUserId('default-user');
                }
            } else if (user) {
                setCurrentUserId(user.id);
            } else {
                // Kullanıcı bulunamadıysa varsayılan ID kullan
                setCurrentUserId('default-user');
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
            // Hata durumunda varsayılan kullanıcı ID'si ayarla
            setCurrentUserId('default-user');
        }
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const fileExtension = file.name.toLowerCase().split('.').pop();
        
        if (fileExtension === 'csv' || fileExtension === 'xlsx' || fileExtension === 'xls') {
            setSelectedImportFile(file);
            setImportMsg('Dosya seçildi. "Ekle" butonuna basarak işlemi başlatın.');
            // Önceki verileri temizle
            setImportedRows([]);
            setImportMapping({});
        } else {
            setImportMsg('Desteklenmeyen dosya formatı. Sadece CSV ve Excel dosyaları desteklenir.');
        }
    };


    // Tekrarlayan işlemler için state
    const [recForm, setRecForm] = useState({
        amount: '',
        description: '',
        categoryId: '',
        startDate: '',
        frequency: 'aylık',
        isIncome: false,
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
            // Tarihi UTC formatında gönder (timezone offset olmadan)
            const formatDateForBackend = (dateString: string) => {
                // dateString formatı: "2025-08-02" (input type="date" formatı)
                // Bu formatı doğrudan kullan, Date objesi oluşturma
                return dateString;
            };

            // Önce Supabase'e gönder
            const recurringData = {
                userId: currentUserId,
                description: recForm.description || `Tekrarlayan: ${recForm.amount} ₺`,
                amount: parseFloat(recForm.amount),
                categoryId: recForm.categoryId,
                accountId: form.accountId || accounts[0]?.id,
                startDate: formatDateForBackend(recForm.startDate),
                frequency: recForm.frequency,
                isIncome: recForm.isIncome,
                isActive: true
            };

            const newRecurring = await supabaseRecurringTransactionService.addRecurringTransaction(recurringData);
            
            if (newRecurring) {
                // Frontend state'ini güncelle
                setRecurrings(prev => [...prev, newRecurring]);
                
                // Tekrarlayan işlemleri yeniden çek
                await fetchRecurringTransactions();
                
                setRecForm({ amount: '', description: '', categoryId: '', startDate: '', frequency: 'aylık', isIncome: false });
                setRecMsg('Tekrarlayan işlem eklendi!');
            } else {
                // Fallback olarak backend'e gönder
                const response = await axios.post('/api/recurring-transaction', {
                    description: recForm.description || `Tekrarlayan: ${recForm.amount} ₺`,
                    amount: parseFloat(recForm.amount),
                    categoryId: recForm.categoryId,
                    accountId: form.accountId || accounts[0]?.id,
                    startDate: formatDateForBackend(recForm.startDate),
                    frequency: recForm.frequency,
                    isIncome: recForm.isIncome,
                    isActive: true
                });
                
                // Frontend state'ini güncelle
                setRecurrings(prev => [...prev, response.data]);
                
                // Tekrarlayan işlemleri yeniden çek
                await fetchRecurringTransactions();
                
                setRecForm({ amount: '', description: '', categoryId: '', startDate: '', frequency: 'aylık', isIncome: false });
                setRecMsg('Tekrarlayan işlem eklendi!');
            }
        } catch (error) {
            console.error('Error adding recurring transaction:', error);
            setRecMsg('Tekrarlayan işlem eklenirken hata oluştu.');
        }
    };
    const handleDeleteRecurring = async (id: string) => {
        try {
            // Önce Supabase'den sil
            const success = await supabaseRecurringTransactionService.deleteRecurringTransaction(id);
            
            if (success) {
                // Frontend state'ini güncelle
                setRecurrings(prev => prev.filter(r => r.id !== id));
                
                // Tekrarlayan işlemleri yeniden çek
                await fetchRecurringTransactions();
            } else {
                // Fallback olarak backend'den sil
                await axios.delete(`/api/recurring-transaction/${id}`);
                
                // Frontend state'ini güncelle
                setRecurrings(prev => prev.filter(r => r.id !== id));
                
                // Tekrarlayan işlemleri yeniden çek
                await fetchRecurringTransactions();
            }
        } catch (error) {
            console.error('Error deleting recurring transaction:', error);
            alert('Tekrarlayan işlem silinirken hata oluştu.');
        }
    };

    // İşlemleri API'den çeken fonksiyon
    const fetchTransactions = useCallback(async () => {
        try {
            // Önce Supabase'den işlemleri al
            const transactions = await supabaseTransactionService.getTransactions(currentUserId);
            if (transactions.length > 0) {
                setTransactions(transactions);
            } else {
                // Fallback olarak backend'den dene
                const response = await axios.get('/api/transaction');
                setTransactions(response.data);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    }, [currentUserId]);

    // Tekrarlayan işlemleri API'den çeken fonksiyon
    const fetchRecurringTransactions = useCallback(async () => {
        try {
            // Önce Supabase'den tekrarlayan işlemleri al
            const recurrings = await supabaseRecurringTransactionService.getRecurringTransactions(currentUserId);
            if (recurrings.length > 0) {
                setRecurrings(recurrings);
            } else {
                // Fallback olarak backend'den dene
                const response = await axios.get('/api/recurring-transaction');
                setRecurrings(response.data);
            }
        } catch (error) {
            console.error('Error fetching recurring transactions:', error);
        }
    }, [currentUserId]);

    // Tekrarlayan işlemleri localStorage'a kaydetme fonksiyonu (artık kullanılmıyor)
    // const saveRecurringTransactions = (transactions: RecurringTransaction[]) => {
    //     localStorage.setItem('recurringTransactions', JSON.stringify(transactions));
    // };

    useEffect(() => {
        fetchCurrentUser(); // Önce mevcut kullanıcıyı getir
    }, []); // Sadece bir kez çalıştır

    // currentUserId değiştiğinde verileri yükle
    useEffect(() => {
        console.log('currentUserId changed to:', currentUserId);
        
        // Hemen varsayılan hesapları yükle
        const loadDefaultData = () => {
            console.log('Loading default data...');
            
            // Varsayılan hesaplar
            const defaultAccounts = [
                {
                    id: 'default-1',
                    userId: currentUserId || 'default-user',
                    accountName: 'Ana Hesap',
                    accountType: 'Vadesiz' as const,
                    balance: 0,
                    currency: 'TRY'
                },
                {
                    id: 'default-2',
                    userId: currentUserId || 'default-user',
                    accountName: 'Tasarruf Hesabı',
                    accountType: 'Vadeli' as const,
                    balance: 0,
                    currency: 'TRY'
                },
                {
                    id: 'default-3',
                    userId: currentUserId || 'default-user',
                    accountName: 'Kredi Kartı',
                    accountType: 'Kredi Kartı' as const,
                    balance: 0,
                    currency: 'TRY'
                }
            ];
            
            // Varsayılan kategoriler
            const defaultCategories = [
                {
                    id: 'cat-1',
                    userId: currentUserId || 'default-user',
                    name: 'Market',
                    color: '#4caf50',
                    icon: '🛒'
                },
                {
                    id: 'cat-2',
                    userId: currentUserId || 'default-user',
                    name: 'Yemek',
                    color: '#ff9800',
                    icon: '🍔'
                },
                {
                    id: 'cat-3',
                    userId: currentUserId || 'default-user',
                    name: 'Ulaşım',
                    color: '#2196f3',
                    icon: '🚕'
                },
                {
                    id: 'cat-4',
                    userId: currentUserId || 'default-user',
                    name: 'Fatura',
                    color: '#e53935',
                    icon: '💡'
                },
                {
                    id: 'cat-5',
                    userId: currentUserId || 'default-user',
                    name: 'Gelir',
                    color: '#4caf50',
                    icon: '💰'
                }
            ];
            
            // Hemen varsayılan verileri yükle
            setAccounts(defaultAccounts);
            setCategories(defaultCategories);
            setForm(f => ({ ...f, accountId: 'default-1' }));
            
            console.log('Default data loaded:', { accounts: defaultAccounts, categories: defaultCategories });
        };
        
        // Hemen gerçek verileri yüklemeye çalış
        if (currentUserId) {
            fetchTransactions();
            fetchRecurringTransactions();
            
            const fetchCategories = async () => {
                try {
                    // Önce Supabase'den kategorileri al
                    const categories = await supabaseCategoryService.getCategories(currentUserId);
                    if (categories.length > 0) {
                        setCategories(categories);
                    } else {
                        // Fallback olarak backend'den dene
                        const response = await axios.get('/api/categories');
                        if (response.data.length > 0) {
                            setCategories(response.data);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching categories:', error);
                }
            };
            
            const fetchAccounts = async () => {
                try {
                    console.log('Fetching accounts for userId:', currentUserId);
                    
                    // Önce Supabase'den hesapları al
                    const accounts = await supabaseAccountService.getAccounts(currentUserId);
                    console.log('Supabase accounts:', accounts);
                    
                    if (accounts.length > 0) {
                        setAccounts(accounts);
                        setForm(f => ({ ...f, accountId: f.accountId || accounts[0].id }));
                        console.log('Set accountId to:', accounts[0].id);
                        console.log('Available accounts:', accounts.map(acc => `${acc.accountName} (${acc.id})`));
                    } else {
                        // Fallback olarak backend'den dene
                        const response = await axios.get('/api/accounts');
                        console.log('Backend accounts:', response.data);
                        
                        if (response.data.length > 0) {
                            setAccounts(response.data);
                            setForm(f => ({ ...f, accountId: f.accountId || response.data[0].id }));
                            console.log('Set accountId to:', response.data[0].id);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching accounts:', error);
                }
            };
            
            // Hemen gerçek verileri yükle
            fetchCategories();
            fetchAccounts();
        } else {
            // currentUserId yoksa varsayılan verileri yükle
            loadDefaultData();
        }
    }, [currentUserId, fetchTransactions, fetchRecurringTransactions]); // currentUserId değiştiğinde yeniden yükle

    // Debug: Hesap ve form durumunu izle
    useEffect(() => {
        console.log('Current form.accountId:', form.accountId);
        console.log('Current accounts:', accounts);
        console.log('Current form:', form);
    }, [form.accountId, accounts, form]);

    // Manuel hesap seçimi için fonksiyon
    const selectFirstAccount = () => {
        if (accounts.length > 0) {
            setForm(f => ({ ...f, accountId: accounts[0].id }));
            console.log('Manually set accountId to:', accounts[0].id);
        }
    };

    // Test için manuel hesap yükleme
    const loadTestAccounts = () => {
        const testAccounts = [
            {
                id: 'test-1',
                userId: 'default-user',
                accountName: 'Test Ana Hesap',
                accountType: 'Vadesiz' as const,
                balance: 0,
                currency: 'TRY'
            },
            {
                id: 'test-2',
                userId: 'default-user',
                accountName: 'Test Yan Hesap',
                accountType: 'Vadeli' as const,
                balance: 0,
                currency: 'TRY'
            }
        ];
        setAccounts(testAccounts);
        setForm(f => ({ ...f, accountId: 'test-1' }));
        console.log('Test accounts loaded:', testAccounts);
    };

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

            // Tarihi UTC formatında gönder (timezone offset olmadan)
            const formatDateForBackend = (dateString: string) => {
                // dateString formatı: "2025-08-02" (input type="date" formatı)
                // Bu formatı doğrudan kullan, Date objesi oluşturma
                return dateString;
            };

            if (editingId) {
                await axios.put(`/api/transaction/${editingId}`, {
                    amount: Math.abs(parseFloat(form.amount)),
                    date: formatDateForBackend(form.date),
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
                    date: formatDateForBackend(form.date),
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
        if (!newCategory.name.trim()) {
            setCatMsg('Kategori adı zorunlu.');
            return;
        }

        try {
            await axios.post('/api/categories', {
                name: newCategory.name,
                color: newCategory.color,
                icon: newCategory.icon
            });
            
            const res = await axios.get('/api/categories');
            setCategories(res.data);
            setNewCategory({ name: '', color: '#764ba2', icon: '🗂️' });
            setCatMsg('Kategori başarıyla eklendi!');
        } catch (error) {
            setCatMsg('Kategori eklenirken hata oluştu.');
        }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            await axios.delete(`/api/categories/${id}`);
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (error) {
            console.error('Error deleting category:', error);
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
            const response = await axios.get(`${receiptUrl}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `receipt_${Date.now()}.png`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading receipt:', error);
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
                    setImportMsg(`${rows.length} satır yüklendi. Veritabanına eklemek için tekrar "Ekle" butonuna basın.`);
                };
                reader.readAsText(selectedImportFile);
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                // Excel dosyası okuma
                const formData = new FormData();
                formData.append('file', selectedImportFile);
                
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
                setImportMsg(`${processedRows.length} satır yüklendi. Veritabanına eklemek için tekrar "Ekle" butonuna basın.`);
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
                    
                    const amount = parseFloat(amountStr.replace(/[^\d.-]/g, ''));
                    if (isNaN(amount)) {
                        errorCount++;
                        continue;
                    }
                    
                    // Kategori ID'sini bul
                    const category = categories.find(c => c.name === finalCategoryName);
                    const categoryId = category?.id || categories[0]?.id;
                    
                    const transactionData = {
                        amount: Math.abs(amount),
                        date: new Date(date).toISOString().split('T')[0],
                        categoryId: categoryId,
                        description: description,
                        isIncome: amount >= 0,
                        accountId: form.accountId || accounts[0]?.id
                    };
                    
                    await axios.post('/api/transaction', transactionData);
                    successCount++;
                } catch (error) {
                    console.error('Error importing transaction:', error);
                    errorCount++;
                }
            }
            
            setImportMsg(`${successCount} işlem başarıyla eklendi. ${errorCount} hata.`);
            setImportedRows([]);
            setImportMapping({});
            setSelectedImportFile(null);
            
            // İşlemler listesini yenile
            await fetchTransactions();
            
        } catch (error) {
            setImportMsg('İşlemler eklenirken hata oluştu.');
            console.error('Import error:', error);
        }
    };

    // Banka hesap özeti işleme fonksiyonları
    const handleBankStatementFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const fileExtension = file.name.toLowerCase().split('.').pop();
        
        // Desteklenen dosya formatlarını kontrol et
        if (!['csv', 'txt', 'xlsx', 'xls', 'pdf'].includes(fileExtension || '')) {
            setBankStatementMsg('Desteklenmeyen dosya formatı. Sadece CSV, TXT, Excel ve PDF dosyaları desteklenir.');
            return;
        }
        
        setSelectedBankFile(file);
        setBankStatementMsg('Dosya seçildi. "Ekle" butonuna basarak işlemi başlatın.');
        // Önceki verileri temizle
        setBankStatementTransactions([]);
    };

    const handleImportBankTransactions = async () => {
        if (!selectedBankFile) {
            setBankStatementMsg('Lütfen önce bir dosya seçin.');
            return;
        }

        try {
            setBankStatementMsg('Banka hesap özeti işleniyor...');
            const formData = new FormData();
            formData.append('file', selectedBankFile);
            formData.append('bankType', bankType);
            
            const response = await axios.post('/api/parse-bank-statement', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            if (response.data.success) {
                const transactions = response.data.transactions.map((tx: any) => {
                    // Tarihi doğru formatta formatla
                    let formattedDate = '';
                    if (tx.date) {
                        if (typeof tx.date === 'string' && tx.date.includes('-')) {
                            const parts = tx.date.split('-');
                            if (parts.length === 3) {
                                formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
                            } else {
                                formattedDate = tx.date;
                            }
                        } else {
                            const d = new Date(tx.date);
                            if (!isNaN(d.getTime())) {
                                const localDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
                                const day = String(localDate.getDate()).padStart(2, '0');
                                const month = String(localDate.getMonth() + 1).padStart(2, '0');
                                const year = localDate.getFullYear();
                                formattedDate = `${day}.${month}.${year}`;
                            } else {
                                formattedDate = tx.date;
                            }
                        }
                    }
                    
                    return {
                        date: formattedDate,
                        description: tx.description,
                        amount: tx.amount,
                        category: tx.category
                    };
                });
                
                setBankStatementTransactions(transactions);
                setBankStatementMsg(`${transactions.length} işlem başarıyla okundu. Veritabanına eklemek için tekrar "Ekle" butonuna basın.`);
            } else {
                setBankStatementMsg('Banka hesap özeti işlenirken hata oluştu.');
            }
        } catch (error) {
            console.error('Bank statement parsing error:', error);
            setBankStatementMsg('Banka hesap özeti işlenirken hata oluştu.');
        }
    };

    const handleImportBankTransactionsToDatabase = async () => {
        if (bankStatementTransactions.length === 0) {
            setBankStatementMsg('İşlenecek veri bulunamadı.');
            return;
        }
        
        try {
            setBankStatementMsg('İşlemler veritabanına ekleniyor...');
            let successCount = 0;
            let errorCount = 0;
            
            for (const tx of bankStatementTransactions) {
                try {
                    // Kategori ID'sini bul
                    const category = categories.find(c => c.name === tx.category);
                    const categoryId = category?.id || categories[0]?.id;
                    
                    // Tarihi UTC formatında gönder
                    const formatDateForBackend = (dateString: string) => {
                        if (typeof dateString === 'string' && dateString.includes('.')) {
                            // DD.MM.YYYY formatını YYYY-MM-DD'ye çevir
                            const parts = dateString.split('.');
                            if (parts.length === 3) {
                                return `${parts[2]}-${parts[1]}-${parts[0]}`;
                            }
                        }
                        return dateString;
                    };

                    const transactionData = {
                        amount: Math.abs(tx.amount),
                        date: formatDateForBackend(tx.date),
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
            setSelectedBankFile(null);
            
            // İşlemler listesini yenile
            await fetchTransactions();
            
        } catch (error) {
            setBankStatementMsg('Banka işlemleri eklenirken hata oluştu.');
            console.error('Bank import error:', error);
        }
    };

    // Temizleme fonksiyonları
    const handleClearImport = () => {
        setImportedRows([]);
        setImportMapping({});
        setImportMsg('');
        setSelectedImportFile(null);
    };

    const handleClearBankStatement = () => {
        setBankStatementTransactions([]);
        setBankStatementMsg('');
        setSelectedBankFile(null);
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <select name="accountId" value={form.accountId ?? ''} onChange={handleFormChange} required style={{ width: 180 }}>
                                                <option value="">Seçiniz</option>
                                                {accounts.map(account => (
                                                    <option key={account.id} value={account.id}>{account.accountName}</option>
                                                ))}
                                            </select>
                                            <button 
                                                type="button" 
                                                onClick={selectFirstAccount}
                                                style={{ 
                                                    padding: '4px 8px', 
                                                    fontSize: '12px', 
                                                    backgroundColor: '#ff9800', 
                                                    color: 'white', 
                                                    border: 'none', 
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                                title="İlk hesabı seç"
                                            >
                                                🔧
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={loadTestAccounts}
                                                style={{ 
                                                    padding: '4px 8px', 
                                                    fontSize: '12px', 
                                                    backgroundColor: '#e53935', 
                                                    color: 'white', 
                                                    border: 'none', 
                                                    borderRadius: '4px',
                                                    cursor: 'pointer'
                                                }}
                                                title="Test hesapları yükle"
                                            >
                                                🧪
                                            </button>
                                        </div>
                                        <small style={{ color: '#666', fontSize: '12px' }}>
                                            Mevcut hesap ID: {form.accountId || 'Boş'} | Hesap sayısı: {accounts.length}
                                            <br />
                                            Hesaplar: {accounts.map(acc => acc.accountName).join(', ') || 'Yok'}
                                        </small>
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
                                                            
                                                            // Eğer raw zaten string ise ve ISO formatında ise
                                                            if (typeof raw === 'string') {
                                                                // ISO format: "2025-08-01T00:00:00.000Z" veya "2025-08-01"
                                                                if (raw.includes('T')) {
                                                                    const datePart = raw.split('T')[0];
                                                                    const parts = datePart.split('-');
                                                                    if (parts.length === 3) {
                                                                        return `${parts[2]}.${parts[1]}.${parts[0]}`;
                                                                    }
                                                                }
                                                                // Sadece tarih format: "2025-08-01"
                                                                else if (raw.includes('-')) {
                                                                    const parts = raw.split('-');
                                                                    if (parts.length === 3) {
                                                                        return `${parts[2]}.${parts[1]}.${parts[0]}`;
                                                                    }
                                                                }
                                                                // Zaten DD.MM.YYYY formatında ise
                                                                else if (raw.includes('.')) {
                                                                    return raw;
                                                                }
                                                            }
                                                            
                                                            // Fallback: Date objesi kullan
                                                            try {
                                                                const d = new Date(raw);
                                                                if (isNaN(d.getTime())) return raw;
                                                                
                                                                const day = String(d.getDate()).padStart(2, '0');
                                                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                                                const year = d.getFullYear();
                                                                return `${day}.${month}.${year}`;
                                                            } catch (error) {
                                                                return raw;
                                                            }
                                                        })();
                                                        return (
                                                            <tr key={tx.id} style={{ background: idx % 2 === 0 ? '#2a2a2a' : '#333' }}>
                                                                <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{formattedDate}</td>
                                                                <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{cat ? `${cat.icon} ${cat.name}` : 'Kategori yok'}</td>
                                                                <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{tx.description}</td>
                                                                <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{Math.abs(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                                <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>
                                                                    <span style={{ 
                                                                        color: tx.amount >= 0 ? '#4caf50' : '#e53935',
                                                                        fontWeight: 'bold'
                                                                    }}>
                                                                        {tx.amount >= 0 ? 'Gelir' : 'Gider'}
                                                                    </span>
                                                                </td>
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
                                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 16, color: '#fff' }}>Kayıt yok.</td></tr>
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
                                    <div style={{ marginBottom: 16 }}>
                                        <label>Dosya Seçin:</label><br />
                                        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImportFile} />
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                                            Desteklenen formatlar: CSV, Excel (.xlsx, .xls)
                                        </div>
                                    </div>
                                    {importMsg && <div style={{ color: 'green', marginTop: 8 }}>{importMsg}</div>}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        <button 
                                            className="category-add-btn" 
                                            onClick={handleImportTransactions}
                                            disabled={!selectedImportFile}
                                            style={{ width: '120px' }}
                                        >
                                            Dosyayı Yükle
                                        </button>
                                        <button 
                                            className="category-add-btn" 
                                            onClick={handleImportTransactionsToDatabase}
                                            disabled={importedRows.length === 0}
                                            style={{ width: '120px' }}
                                        >
                                            Ekle
                                        </button>
                                        <button 
                                            className="category-add-btn" 
                                            onClick={handleClearImport}
                                            disabled={importedRows.length === 0}
                                            style={{ width: '120px', background: '#e53935' }}
                                        >
                                            Temizle
                                        </button>
                                    </div>

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
                                    <div style={{ marginBottom: 16 }}>
                                        <label>Banka Hesap Özeti Dosyası:</label><br />
                                        <input type="file" accept=".csv,.txt,.xlsx,.xls,.pdf" onChange={handleBankStatementFile} />
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                                            Desteklenen formatlar: CSV, TXT, Excel (.xlsx, .xls), PDF
                                        </div>
                                    </div>
                                    {bankStatementMsg && <div style={{ color: 'green', marginTop: 8 }}>{bankStatementMsg}</div>}
                                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                        <button 
                                            className="category-add-btn" 
                                            onClick={handleImportBankTransactions}
                                            disabled={!selectedBankFile}
                                            style={{ width: '120px' }}
                                        >
                                            Dosyayı Yükle
                                        </button>
                                        <button 
                                            className="category-add-btn" 
                                            onClick={handleImportBankTransactionsToDatabase}
                                            disabled={bankStatementTransactions.length === 0}
                                            style={{ width: '120px' }}
                                        >
                                            Ekle
                                        </button>
                                        <button 
                                            className="category-add-btn" 
                                            onClick={handleClearBankStatement}
                                            disabled={bankStatementTransactions.length === 0}
                                            style={{ width: '120px', background: '#e53935' }}
                                        >
                                            Temizle
                                        </button>
                                    </div>

                                    {bankStatementTransactions.length > 0 && (
                                        <div style={{ marginTop: 20 }}>
                                            {/* Kategori İstatistikleri */}
                                            <div style={{ 
                                                background: '#1a1a1a', 
                                                padding: 16, 
                                                borderRadius: 8, 
                                                marginBottom: 16,
                                                border: '1px solid #333'
                                            }}>
                                                <h4 style={{ color: '#fff', margin: '0 0 12px 0' }}>📊 Otomatik Kategori İstatistikleri</h4>
                                                {(() => {
                                                    const categoryStats = bankStatementTransactions.reduce((acc, tx) => {
                                                        const matchedCategory = matchCategoryByDescription(tx.description);
                                                        const isMatched = matchedCategory && matchedCategory === tx.category;
                                                        const hasMatch = matchedCategory !== null;
                                                        
                                                        if (isMatched) acc.perfect++;
                                                        else if (hasMatch) acc.different++;
                                                        else acc.noMatch++;
                                                        
                                                        return acc;
                                                    }, { perfect: 0, different: 0, noMatch: 0 });
                                                    
                                                    const total = bankStatementTransactions.length;
                                                    const perfectRate = ((categoryStats.perfect / total) * 100).toFixed(1);
                                                    const matchRate = (((categoryStats.perfect + categoryStats.different) / total) * 100).toFixed(1);
                                                    
                                                    return (
                                                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                                            <div style={{ 
                                                                background: '#1a3a1a', 
                                                                padding: '8px 12px', 
                                                                borderRadius: 6,
                                                                border: '1px solid #4caf50'
                                                            }}>
                                                                <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ Mükemmel Eşleşme: {categoryStats.perfect} ({perfectRate}%)</span>
                                                            </div>
                                                            <div style={{ 
                                                                background: '#3a2a1a', 
                                                                padding: '8px 12px', 
                                                                borderRadius: 6,
                                                                border: '1px solid #ff9800'
                                                            }}>
                                                                <span style={{ color: '#ff9800', fontWeight: 'bold' }}>⚠️ Farklı Kategori: {categoryStats.different}</span>
                                                            </div>
                                                            <div style={{ 
                                                                background: '#3a1a1a', 
                                                                padding: '8px 12px', 
                                                                borderRadius: 6,
                                                                border: '1px solid #f44336'
                                                            }}>
                                                                <span style={{ color: '#f44336', fontWeight: 'bold' }}>❌ Eşleşme Yok: {categoryStats.noMatch}</span>
                                                            </div>
                                                            <div style={{ 
                                                                background: '#1a2a3a', 
                                                                padding: '8px 12px', 
                                                                borderRadius: 6,
                                                                border: '1px solid #2196f3'
                                                            }}>
                                                                <span style={{ color: '#2196f3', fontWeight: 'bold' }}>📈 Genel Başarı: {matchRate}%</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            
                                            {/* İşlem Tablosu */}
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#2a2a2a' }}>
                                                    <thead>
                                                        <tr style={{ background: '#3a3a3a' }}>
                                                            <th style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>Tarih</th>
                                                            <th style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>Açıklama</th>
                                                            <th style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>Tutar</th>
                                                            <th style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>Otomatik Kategori</th>
                                                            <th style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>Eşleşme Durumu</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {bankStatementTransactions.map((tx, idx) => {
                                                            const matchedCategory = matchCategoryByDescription(tx.description);
                                                            const isMatched = matchedCategory && matchedCategory === tx.category;
                                                            const hasMatch = matchedCategory !== null;
                                                            
                                                            return (
                                                                <tr key={idx} style={{ background: idx % 2 === 0 ? '#2a2a2a' : '#333' }}>
                                                                    <td style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>{tx.date}</td>
                                                                    <td style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>{tx.description}</td>
                                                                    <td style={{ padding: 8, border: '1px solid #555', color: '#fff' }}>{tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                                    <td style={{ padding: 8, border: '1px solid #555', background: '#1a3a1a', fontWeight: 'bold' }}>
                                                                        <span style={{ color: '#4caf50' }}>✅ {tx.category}</span>
                                                                    </td>
                                                                    <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center' }}>
                                                                        {isMatched ? (
                                                                            <span style={{ color: '#4caf50', fontWeight: 'bold' }}>✅ Mükemmel</span>
                                                                        ) : hasMatch ? (
                                                                            <span style={{ color: '#ff9800', fontWeight: 'bold' }}>⚠️ Farklı: {matchedCategory}</span>
                                                                        ) : (
                                                                            <span style={{ color: '#f44336', fontWeight: 'bold' }}>❌ Eşleşme Yok</span>
                                                                        )}
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
                                    <div>
                                        <label>İşlem Türü:</label><br />
                                        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                <input 
                                                    type="radio" 
                                                    name="isIncome" 
                                                    value="false" 
                                                    checked={!recForm.isIncome} 
                                                    onChange={() => setRecForm(f => ({ ...f, isIncome: false }))}
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
                                                    checked={recForm.isIncome} 
                                                    onChange={() => setRecForm(f => ({ ...f, isIncome: true }))}
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
                                                <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Tür</th>
                                                <th style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>Sil</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recurrings.length > 0 ? (
                                                recurrings.map((r, idx) => {
                                                    const cat = categories.find(c => c.id.toString() === r.categoryId.toString());
                                                    return (
                                                        <tr key={r.id} style={{ background: idx % 2 === 0 ? '#2a2a2a' : '#333' }}>
                                                            <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{Math.abs(r.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                                                            <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{cat ? `${cat.icon} ${cat.name}` : 'Kategori yok'}</td>
                                                            <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{r.description}</td>
                                                            <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{(() => {
                                                                const raw = r.startDate;
                                                                if (!raw) return '';
                                                                
                                                                // Eğer raw zaten string ise ve ISO formatında ise
                                                                if (typeof raw === 'string') {
                                                                    // ISO format: "2025-08-01T00:00:00.000Z" veya "2025-08-01"
                                                                    if (raw.includes('T')) {
                                                                        const datePart = raw.split('T')[0];
                                                                        const parts = datePart.split('-');
                                                                        if (parts.length === 3) {
                                                                            return `${parts[2]}.${parts[1]}.${parts[0]}`;
                                                                        }
                                                                    }
                                                                    // Sadece tarih format: "2025-08-01"
                                                                    else if (raw.includes('-')) {
                                                                        const parts = raw.split('-');
                                                                        if (parts.length === 3) {
                                                                            return `${parts[2]}.${parts[1]}.${parts[0]}`;
                                                                        }
                                                                    }
                                                                    // Zaten DD.MM.YYYY formatında ise
                                                                    else if (raw.includes('.')) {
                                                                        return raw;
                                                                    }
                                                                }
                                                                
                                                                // Fallback: Date objesi kullan
                                                                try {
                                                                    const d = new Date(raw);
                                                                    if (isNaN(d.getTime())) return raw;
                                                                    
                                                                    const day = String(d.getDate()).padStart(2, '0');
                                                                    const month = String(d.getMonth() + 1).padStart(2, '0');
                                                                    const year = d.getFullYear();
                                                                    return `${day}.${month}.${year}`;
                                                                } catch (error) {
                                                                    return raw;
                                                                }
                                                            })()}</td>
                                                            <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>{r.frequency}</td>
                                                            <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center', color: '#fff' }}>
                                                                <span style={{ 
                                                                    color: r.isIncome ? '#4caf50' : '#e53935',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {r.isIncome ? 'Gelir' : 'Gider'}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: 8, border: '1px solid #555', textAlign: 'center' }}><button onClick={() => handleDeleteRecurring(r.id)} style={{ background: '#e53935', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Sil</button></td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 16, color: '#fff' }}>Kayıt yok.</td></tr>
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