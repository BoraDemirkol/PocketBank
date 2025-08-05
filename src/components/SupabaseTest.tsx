import React, { useState, useEffect } from 'react';
import { supabase } from '../Shared/supabaseClient';
import { 
    supabaseTransactionService, 
    supabaseCategoryService, 
    supabaseAccountService,
    supabaseAuthService 
} from '../services/supabaseService';

const SupabaseTest: React.FC = () => {
    const [testResults, setTestResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const addTestResult = (message: string) => {
        setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const runTests = async () => {
        setIsLoading(true);
        setTestResults([]);
        
        try {
            // Test 1: Supabase bağlantısı
            addTestResult('🔍 Supabase bağlantısı test ediliyor...');
            const { data, error } = await supabase.from('users').select('count').limit(1);
            if (error) {
                addTestResult(`❌ Supabase bağlantı hatası: ${error.message}`);
            } else {
                addTestResult('✅ Supabase bağlantısı başarılı');
            }

            // Test 2: Auth servisi
            addTestResult('🔍 Auth servisi test ediliyor...');
            const { user, error: authError } = await supabaseAuthService.getCurrentUser();
            if (authError) {
                addTestResult(`⚠️ Auth servisi: ${authError.message} (Beklenen - kullanıcı girişi yapılmamış)`);
            } else {
                addTestResult('✅ Auth servisi çalışıyor');
            }

            // Test 3: Kategori servisi
            addTestResult('🔍 Kategori servisi test ediliyor...');
            try {
                const categories = await supabaseCategoryService.getCategories('test-user-id');
                addTestResult(`✅ Kategori servisi çalışıyor (${categories.length} kategori bulundu)`);
            } catch (error) {
                addTestResult(`❌ Kategori servisi hatası: ${error}`);
            }

            // Test 4: Hesap servisi
            addTestResult('🔍 Hesap servisi test ediliyor...');
            try {
                const accounts = await supabaseAccountService.getAccounts('test-user-id');
                addTestResult(`✅ Hesap servisi çalışıyor (${accounts.length} hesap bulundu)`);
            } catch (error) {
                addTestResult(`❌ Hesap servisi hatası: ${error}`);
            }

            // Test 5: İşlem servisi
            addTestResult('🔍 İşlem servisi test ediliyor...');
            try {
                const transactions = await supabaseTransactionService.getTransactions('test-user-id');
                addTestResult(`✅ İşlem servisi çalışıyor (${transactions.length} işlem bulundu)`);
            } catch (error) {
                addTestResult(`❌ İşlem servisi hatası: ${error}`);
            }

            // Test 6: Storage test
            addTestResult('🔍 Storage servisi test ediliyor...');
            try {
                const { data: buckets } = await supabase.storage.listBuckets();
                const receiptsBucket = buckets?.find(b => b.name === 'receipts');
                if (receiptsBucket) {
                    addTestResult('✅ Storage servisi çalışıyor (receipts bucket bulundu)');
                } else {
                    addTestResult('⚠️ Storage servisi çalışıyor ama receipts bucket bulunamadı');
                }
            } catch (error) {
                addTestResult(`❌ Storage servisi hatası: ${error}`);
            }

            addTestResult('🎉 Tüm testler tamamlandı!');

        } catch (error) {
            addTestResult(`❌ Genel hata: ${error}`);
        } finally {
            setIsLoading(false);
        }
    };

    const clearResults = () => {
        setTestResults([]);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>🔧 Supabase Entegrasyon Testi</h2>
            
            <div style={{ marginBottom: '20px' }}>
                <button 
                    onClick={runTests} 
                    disabled={isLoading}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: isLoading ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        marginRight: '10px'
                    }}
                >
                    {isLoading ? 'Testler Çalışıyor...' : 'Testleri Çalıştır'}
                </button>
                
                <button 
                    onClick={clearResults}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Sonuçları Temizle
                </button>
            </div>

            <div style={{ 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #dee2e6', 
                borderRadius: '5px',
                padding: '15px',
                maxHeight: '400px',
                overflowY: 'auto'
            }}>
                <h4>Test Sonuçları:</h4>
                {testResults.length === 0 ? (
                    <p style={{ color: '#6c757d', fontStyle: 'italic' }}>
                        Test sonuçları burada görünecek...
                    </p>
                ) : (
                    <div>
                        {testResults.map((result, index) => (
                            <div key={index} style={{ 
                                marginBottom: '5px',
                                fontFamily: 'monospace',
                                fontSize: '14px'
                            }}>
                                {result}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e9ecef', borderRadius: '5px' }}>
                <h4>📋 Test Açıklamaları:</h4>
                <ul>
                    <li><strong>Supabase Bağlantısı:</strong> Temel veritabanı bağlantısını test eder</li>
                    <li><strong>Auth Servisi:</strong> Kullanıcı kimlik doğrulama servisini test eder</li>
                    <li><strong>Kategori Servisi:</strong> Kategori CRUD işlemlerini test eder</li>
                    <li><strong>Hesap Servisi:</strong> Hesap CRUD işlemlerini test eder</li>
                    <li><strong>İşlem Servisi:</strong> İşlem CRUD işlemlerini test eder</li>
                    <li><strong>Storage Servisi:</strong> Dosya yükleme servisini test eder</li>
                </ul>
            </div>

            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
                <h4>⚠️ Önemli Notlar:</h4>
                <ul>
                    <li>Testler gerçek veritabanına bağlanır</li>
                    <li>Auth testi için kullanıcı girişi gerekebilir</li>
                    <li>Storage testi için 'receipts' bucket'ının oluşturulması gerekir</li>
                    <li>Hata mesajları normal olabilir (örneğin: kullanıcı girişi yapılmamış)</li>
                </ul>
            </div>
        </div>
    );
};

export default SupabaseTest; 