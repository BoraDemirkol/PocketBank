import React, { useState } from 'react';
import { Form, Input, Select, DatePicker, Radio, Button, Upload, message, Card, Row, Col } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { apiService } from '../../api';
import type { Category, Account } from '../../types/transaction';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface TransactionFormProps {
  categories: Category[];
  accounts: Account[];
  onTransactionAdded: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  categories,
  accounts,
  onTransactionAdded
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState('Gider');

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      let receiptUrl: string | null = null;
      
      // Handle receipt upload if file is selected
      if (values.receipt && values.receipt[0]) {
        const formData = new FormData();
        formData.append('file', values.receipt[0].originFileObj);
        
        const uploadResponse = await fetch('http://localhost:5271/api/upload-receipt', {
          method: 'POST',
          headers: await apiService.getAuthHeaders(),
          body: formData,
        });
        
        const uploadData = await uploadResponse.json();
        receiptUrl = uploadData.url;
      }

      // Prepare transaction data
      const transactionData = {
        amount: Math.abs(parseFloat(values.amount)),
        transactionDate: values.date.format('YYYY-MM-DD'),
        categoryId: values.categoryId,
        description: values.description,
        transactionType: transactionType,
        accountId: values.accountId,
        receiptUrl: receiptUrl
      };

      await apiService.post('/transactions', transactionData);
      
      message.success('İşlem başarıyla eklendi!');
      form.resetFields();
      onTransactionAdded();
      
    } catch (error) {
      console.error('Error adding transaction:', error);
      message.error('İşlem eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: () => false, // Prevent auto upload
    maxCount: 1,
    accept: 'image/*'
  };

  return (
    <Card 
      title="Yeni İşlem Ekle" 
      style={{ marginBottom: '24px' }}
      headStyle={{ backgroundColor: '#4a7c59', color: 'white' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          date: dayjs(),
          transactionType: 'Gider'
        }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Tutar"
              name="amount"
              rules={[{ required: true, message: 'Lütfen tutar giriniz!' }]}
            >
              <Input 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder="0.00"
                addonAfter="₺"
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              label="Tarih"
              name="date"
              rules={[{ required: true, message: 'Lütfen tarih seçiniz!' }]}
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD.MM.YYYY"
                placeholder="gg.aa.yyyy"
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              label="Hesap"
              name="accountId"
              rules={[{ required: true, message: 'Lütfen hesap seçiniz!' }]}
            >
              <Select placeholder="Seçiniz">
                {(accounts || []).map(account => (
                  <Option key={account.id} value={account.id}>
                    {account.accountName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Kategori"
              name="categoryId"
              rules={[{ required: true, message: 'Lütfen kategori seçiniz!' }]}
            >
              <Select placeholder="Seçiniz">
                {(categories || []).map(category => (
                  <Option key={category.id} value={category.id}>
                    <span style={{ marginRight: '8px' }}>{category.icon}</span>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label="İşlem Türü"
              name="transactionType"
            >
              <Radio.Group 
                value={transactionType} 
                onChange={(e) => setTransactionType(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button 
                  value="Gider"
                  style={{ 
                    backgroundColor: transactionType === 'Gider' ? '#ff4d4f' : 'transparent',
                    borderColor: '#ff4d4f',
                    color: transactionType === 'Gider' ? 'white' : '#666'
                  }}
                >
                  ▼ Gider
                </Radio.Button>
                <Radio.Button 
                  value="Gelir"
                  style={{ 
                    backgroundColor: transactionType === 'Gelir' ? '#52c41a' : 'transparent',
                    borderColor: '#52c41a',
                    color: transactionType === 'Gelir' ? 'white' : '#666'
                  }}
                >
                  ▲ Gelir
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={16}>
            <Form.Item
              label="Açıklama"
              name="description"
              rules={[{ required: true, message: 'Lütfen açıklama giriniz!' }]}
            >
              <TextArea 
                rows={3} 
                placeholder="İşlem açıklaması..."
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              label="Makbuz"
              name="receipt"
            >
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>
                  Makbuz Yükle
                </Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<PlusOutlined />}
            style={{ 
              backgroundColor: '#4a7c59', 
              borderColor: '#4a7c59',
              width: '100%'
            }}
          >
            İşlem Ekle
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TransactionForm;
