import React, { useState } from 'react';
import { Upload, Button, Table, Card, Row, Col, message, Alert } from 'antd';
import { UploadOutlined, ClearOutlined } from '@ant-design/icons';
import type { Category, Account } from '../../types/transaction';
import axios from 'axios';

interface BulkImportProps {
  categories: Category[];
  accounts: Account[];
  onImportComplete: () => void;
}

interface ImportedRow {
  date: string;
  description: string;
  amount: number;
  categoryId: string;
  accountId: string;
  transactionType: string;
}

const BulkImport: React.FC<BulkImportProps> = ({
  categories,
  accounts,
  onImportComplete
}) => {
  const [importedData, setImportedData] = useState<ImportedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post('/api/import/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.transactions) {
        setImportedData(response.data.transactions);
        message.success(`${response.data.transactions.length} işlem başarıyla yüklendi!`);
      } else {
        message.error('Dosya işlenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      message.error('Dosya işlenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (importedData.length === 0) {
      message.warning('İçe aktarılacak veri bulunamadı');
      return;
    }

    try {
      setLoading(true);
      
      // Validate data
      const validData = importedData.filter(row => 
        row.date && row.description && row.amount && row.categoryId && row.accountId
      );

      if (validData.length !== importedData.length) {
        message.warning(`${importedData.length - validData.length} satır eksik veri nedeniyle atlandı`);
      }

      // Import valid transactions
      for (const row of validData) {
        await axios.post('/api/transactions', {
          transactionDate: row.date,
          description: row.description,
          amount: Math.abs(row.amount),
          categoryId: row.categoryId,
          accountId: row.accountId,
          transactionType: row.transactionType || 'Gider'
        });
      }

      message.success(`${validData.length} işlem başarıyla içe aktarıldı!`);
      setImportedData([]);
      onImportComplete();
      
    } catch (error) {
      console.error('Error importing transactions:', error);
      message.error('İçe aktarma sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    setImportedData([]);
  };

  const columns = [
    {
      title: 'Tarih',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => date || '-'
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
      )
    },
    {
      title: 'Kategori',
      dataIndex: 'categoryId',
      key: 'categoryId',
      render: (categoryId: string) => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : '-';
      }
    },
    {
      title: 'Hesap',
      dataIndex: 'accountId',
      key: 'accountId',
      render: (accountId: string) => {
        const account = accounts.find(a => a.id === accountId);
        return account ? account.accountName : '-';
      }
    },
    {
      title: 'Tür',
      dataIndex: 'transactionType',
      key: 'transactionType',
      render: (type: string) => type || 'Gider'
    }
  ];

  const uploadProps = {
    beforeUpload: (file: File) => {
      const isCsv = file.type === 'text/csv' || file.name.endsWith('.csv');
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                     file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      
      if (!isCsv && !isExcel) {
        message.error('Sadece CSV ve Excel dosyaları desteklenir!');
        return false;
      }
      
      handleFileUpload(file);
      return false; // Prevent auto upload
    },
    accept: '.csv,.xlsx,.xls',
    maxCount: 1
  };

  return (
    <Card 
      title="Toplu İçe Aktar" 
      style={{ marginBottom: '24px' }}
      headStyle={{ backgroundColor: '#4a7c59', color: 'white' }}
    >
      <Alert
        message="Dosya Formatı"
        description="CSV veya Excel dosyası yükleyin. Dosya şu sütunları içermelidir: Tarih, Açıklama, Tutar, Kategori, Hesap, Tür (opsiyonel)"
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Upload {...uploadProps}>
            <Button 
              icon={<UploadOutlined />} 
              loading={uploading}
              style={{ backgroundColor: '#4a7c59', borderColor: '#4a7c59' }}
            >
              Dosya Seç
            </Button>
          </Upload>
        </Col>
        
        <Col span={12}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              type="primary" 
              onClick={handleImport}
              loading={loading}
              disabled={importedData.length === 0}
              style={{ backgroundColor: '#4a7c59', borderColor: '#4a7c59' }}
            >
              İçe Aktar ({importedData.length})
            </Button>
            
            {importedData.length > 0 && (
              <Button 
                icon={<ClearOutlined />}
                onClick={clearData}
                danger
              >
                Temizle
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {importedData.length > 0 && (
        <div>
          <h3>Önizleme ({importedData.length} işlem)</h3>
          <Table
            columns={columns}
            dataSource={importedData}
            rowKey={(_, index) => index?.toString() || '0'}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true
            }}
            scroll={{ x: 800 }}
          />
        </div>
      )}
    </Card>
  );
};

export default BulkImport;
