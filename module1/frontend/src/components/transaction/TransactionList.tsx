import React, { useState, useMemo } from 'react';
import { Table, Input, DatePicker, Select, Button, Popconfirm, message, Card, Row, Col, Space, Tag } from 'antd';
import { DeleteOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { Transaction, Category, Account } from '../../types/transaction';
import { apiService } from '../../api';
import dayjs from 'dayjs';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onTransactionDeleted: () => void;
}

interface Filters {
  search: string;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  categoryId: string;
  accountId: string;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  accounts,
  onTransactionDeleted
}) => {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    dateRange: null,
    categoryId: '',
    accountId: ''
  });

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter(tx => {
      // Search filter
      const matchesSearch = !filters.search || 
        (tx.description && tx.description.toLowerCase().includes(filters.search.toLowerCase()));

      // Date range filter
      const matchesDate = !filters.dateRange || (() => {
        const [startDate, endDate] = filters.dateRange;
        const txDate = dayjs(tx.transactionDate);
        return txDate.isAfter(startDate, 'day') && txDate.isBefore(endDate, 'day');
      })();

      // Category filter
      const matchesCategory = !filters.categoryId || 
        String(tx.categoryId) === String(filters.categoryId);

      // Account filter
      const matchesAccount = !filters.accountId || 
        String(tx.accountId) === String(filters.accountId);

      return matchesSearch && matchesDate && matchesCategory && matchesAccount;
    });
  }, [transactions, filters]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`http://localhost:5271/api/transactions/${id}`, { 
        method: 'DELETE',
        headers: await apiService.getAuthHeaders(),
      });
      message.success('İşlem başarıyla silindi');
      onTransactionDeleted();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      message.error('İşlem silinirken hata oluştu');
    }
  };

  const handleDownloadReceipt = (receiptUrl: string) => {
    if (receiptUrl) {
      window.open(receiptUrl, '_blank');
    }
  };

  const columns = [
    {
      title: 'Tarih',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      render: (_: string, record: Transaction) => {
        const txDate = record.transactionDate;
        return txDate ? dayjs(txDate).format('DD.MM.YYYY') : '-';
      },
      sorter: (a: Transaction, b: Transaction) => {
        const dateA = dayjs(a.transactionDate);
        const dateB = dayjs(b.transactionDate);
        return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
      }
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      render: (description: string) => description || '-'
    },
    {
      title: 'Tutar',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ 
          color: amount >= 0 ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {amount >= 0 ? '+' : ''}{amount.toFixed(2)} ₺
        </span>
      ),
      sorter: (a: Transaction, b: Transaction) => a.amount - b.amount
    },
    {
      title: 'Kategori',
      dataIndex: 'categoryId',
      key: 'categoryId',
      render: (categoryId: string, record: Transaction) => {
        const category = record.category || categories.find(c => String(c.id) === String(categoryId));
        return category ? (
          <Tag color={category.color || '#4a7c59'}>
            <span style={{ marginRight: '4px' }}>{category.icon}</span>
            {category.name}
          </Tag>
        ) : '-';
      }
    },
    {
      title: 'Hesap',
      dataIndex: 'accountId',
      key: 'accountId',
      render: (accountId: string) => {
        const account = accounts.find(a => String(a.id) === String(accountId));
        return account ? account.accountName : '-';
      }
    },
    {
      title: 'Tür',
      dataIndex: 'transactionType',
      key: 'transactionType',
      render: (type: string) => (
        <Tag color={type === 'Gelir' ? '#52c41a' : '#ff4d4f'}>
          {type || 'Gider'}
        </Tag>
      )
    },
    {
      title: 'Makbuz',
      dataIndex: 'receiptUrl',
      key: 'receiptUrl',
      render: (receiptUrl: string) => (
        receiptUrl ? (
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleDownloadReceipt(receiptUrl)}
          >
            Görüntüle
          </Button>
        ) : '-'
      )
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: Transaction) => (
        <Space>
          <Popconfirm
            title="Bu işlemi silmek istediğinizden emin misiniz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    }
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const response = await fetch(`/api/transactions/export/${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `islemler_${dayjs().format('YYYYMMDD')}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Dışa aktarma sırasında hata oluştu');
    }
  };

  return (
    <Card 
      title="İşlem Listesi" 
      style={{ marginBottom: '24px' }}
      headStyle={{ backgroundColor: '#4a7c59', color: 'white' }}
    >
      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={6}>
          <Search
            placeholder="Açıklama ara..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            allowClear
          />
        </Col>
        <Col span={6}>
          <RangePicker
            placeholder={['Başlangıç', 'Bitiş']}
            value={filters.dateRange}
            onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] | null }))}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={4}>
          <Select
            placeholder="Kategori"
            value={filters.categoryId}
            onChange={(value) => setFilters(prev => ({ ...prev, categoryId: value }))}
            allowClear
            style={{ width: '100%' }}
          >
            {categories.map(category => (
              <Option key={category.id} value={category.id}>
                {category.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Select
            placeholder="Hesap"
            value={filters.accountId}
            onChange={(value) => setFilters(prev => ({ ...prev, accountId: value }))}
            allowClear
            style={{ width: '100%' }}
          >
            {accounts.map(account => (
              <Option key={account.id} value={account.id}>
                {account.accountName}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={4}>
          <Space>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => handleExport('csv')}
              style={{ backgroundColor: '#4a7c59', borderColor: '#4a7c59' }}
            >
              CSV
            </Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => handleExport('excel')}
              style={{ backgroundColor: '#4a7c59', borderColor: '#4a7c59' }}
            >
              Excel
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Transactions Table */}
      <Table
        columns={columns}
        dataSource={filteredTransactions}
        rowKey={(record) => record.id}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} / ${total} işlem`
        }}
        rowSelection={rowSelection}
        scroll={{ x: 1200 }}
      />
    </Card>
  );
};

export default TransactionList;
