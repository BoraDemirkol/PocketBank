import React, { useState, useEffect } from 'react';
import { Tabs, Button, Space, message } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Transaction, Category, Account, RecurringTransaction } from '../../types/transaction';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import CategoryManagement from './CategoryManagement';
import BulkImport from './BulkImport';
import BankStatementImport from './BankStatementImport';
import RecurringTransactions from './RecurringTransactions';
import { apiService } from '../../api';



const TransactionManagement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsRes, categoriesRes, accountsRes, recurringRes] = await Promise.all([
        apiService.get('/transactions'),
        apiService.get('/categories'),
        apiService.get('/accounts'),
        apiService.get('/recurring-transactions')
      ]);

      console.log('API Responses:', {
        transactions: transactionsRes.data,
        categories: categoriesRes.data,
        accounts: accountsRes.data,
        recurring: recurringRes.data
      });
      
      setTransactions(transactionsRes.data || []);
      setCategories(categoriesRes.data || []);
      setAccounts(accountsRes.data || []);
      setRecurringTransactions(recurringRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAdded = () => {
    fetchData();
  };

  const handleTransactionDeleted = () => {
    fetchData();
  };

  const handleCategoryAdded = () => {
    fetchData();
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const response = await fetch(`http://localhost:5271/api/transactions/export/${format}`, {
        method: 'GET',
        headers: await apiService.getAuthHeaders(),
      });
      
      const url = window.URL.createObjectURL(new Blob([await response.blob()]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `islemler_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success(`${format.toUpperCase()} dosyası başarıyla indirildi!`);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Dışa aktarma sırasında hata oluştu');
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/dashboard')}
            style={{ borderColor: '#4a7c59', color: '#4a7c59' }}
          >
            Geri Dön
          </Button>
          <h1 style={{ margin: 0, color: '#4a7c59' }}>İşlem Yönetimi</h1>
        </div>
        
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchData}
            loading={loading}
            style={{ borderColor: '#4a7c59', color: '#4a7c59' }}
          >
            Yenile
          </Button>
          <Button 
            icon={<FileTextOutlined />} 
            onClick={() => handleExport('csv')}
            style={{ backgroundColor: '#4a7c59', borderColor: '#4a7c59' }}
          >
            CSV İndir
          </Button>
          <Button 
            icon={<FileExcelOutlined />} 
            onClick={() => handleExport('excel')}
            style={{ backgroundColor: '#4a7c59', borderColor: '#4a7c59' }}
          >
            Excel İndir
          </Button>
        </Space>
      </div>

      {/* Tabs */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'transactions',
            label: 'İşlemler',
            children: (
              <div>
                <TransactionForm 
                  categories={categories}
                  accounts={accounts}
                  onTransactionAdded={handleTransactionAdded}
                />
                <TransactionList 
                  transactions={transactions}
                  categories={categories}
                  accounts={accounts}
                  onTransactionDeleted={handleTransactionDeleted}
                />
              </div>
            )
          },
          {
            key: 'categories',
            label: 'Kategoriler',
            children: (
              <CategoryManagement onCategoryAdded={handleCategoryAdded} />
            )
          },
          {
            key: 'bulk-import',
            label: 'Toplu İçe Aktar',
            children: (
              <BulkImport 
                categories={categories}
                accounts={accounts}
                onImportComplete={handleTransactionAdded}
              />
            )
          },
          {
            key: 'bank-statement',
            label: 'Banka Ekstresi',
            children: (
              <BankStatementImport 
                categories={categories}
                accounts={accounts}
                onImportComplete={handleTransactionAdded}
              />
            )
          },
          {
            key: 'recurring',
            label: 'Tekrarlanan İşlemler',
            children: (
              <RecurringTransactions 
                categories={categories}
                accounts={accounts}
                recurringTransactions={recurringTransactions}
                onRecurringTransactionChanged={fetchData}
              />
            )
          }
        ]}
      />
    </div>
  );
};

export default TransactionManagement;
