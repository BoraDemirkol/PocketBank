import React, { useState } from 'react';
import { Form, Input, Select, DatePicker, Radio, Button, Table, Card, Row, Col, Popconfirm, message, Space, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { Category, Account, RecurringTransaction } from '../../types/transaction';
import axios from 'axios';
import dayjs from 'dayjs';

const { Option } = Select;

interface RecurringTransactionsProps {
  categories: Category[];
  accounts: Account[];
  recurringTransactions: RecurringTransaction[];
  onRecurringTransactionChanged: () => void;
}

const RecurringTransactions: React.FC<RecurringTransactionsProps> = ({
  categories,
  accounts,
  recurringTransactions,
  onRecurringTransactionChanged
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      const transactionData = {
        description: values.description,
        amount: Math.abs(parseFloat(values.amount)),
        categoryId: values.categoryId,
        accountId: values.accountId,
        startDate: values.startDate.format('YYYY-MM-DD'),
        frequency: values.frequency,
        isIncome: values.isIncome,
        isActive: values.isActive
      };

      if (editingId) {
        await axios.put(`/api/recurring-transactions/${editingId}`, transactionData);
        message.success('Tekrarlanan işlem başarıyla güncellendi!');
        setEditingId(null);
      } else {
        await axios.post('/api/recurring-transactions', transactionData);
        message.success('Tekrarlanan işlem başarıyla eklendi!');
      }
      
      form.resetFields();
      onRecurringTransactionChanged();
      
    } catch (error) {
      console.error('Error saving recurring transaction:', error);
      message.error('Tekrarlanan işlem kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: RecurringTransaction) => {
    setEditingId(transaction.id);
    form.setFieldsValue({
      description: transaction.description,
      amount: Math.abs(transaction.amount),
      categoryId: transaction.categoryId,
      accountId: transaction.accountId,
      startDate: dayjs(transaction.startDate),
      frequency: transaction.frequency,
      isIncome: transaction.isIncome,
      isActive: transaction.isActive
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/recurring-transactions/${id}`);
      message.success('Tekrarlanan işlem başarıyla silindi!');
      onRecurringTransactionChanged();
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      message.error('Tekrarlanan işlem silinirken hata oluştu');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.resetFields();
  };

  const columns = [
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
      render: (categoryId: string, record: RecurringTransaction) => {
        const category = record.category || categories.find(c => c.id === categoryId);
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
      render: (accountId: string, record: RecurringTransaction) => {
        const account = record.account || accounts.find(a => a.id === accountId);
        return account ? account.accountName : '-';
      }
    },
    {
      title: 'Başlangıç',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => date ? dayjs(date).format('DD.MM.YYYY') : '-'
    },
    {
      title: 'Sıklık',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (frequency: string) => frequency || '-'
    },
    {
      title: 'Tür',
      dataIndex: 'isIncome',
      key: 'isIncome',
      render: (isIncome: boolean) => (
        <Tag color={isIncome ? '#52c41a' : '#ff4d4f'}>
          {isIncome ? 'Gelir' : 'Gider'}
        </Tag>
      )
    },
    {
      title: 'Durum',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? '#52c41a' : '#ff4d4f'}>
          {isActive ? 'Aktif' : 'Pasif'}
        </Tag>
      )
    },
    {
      title: 'Son İşlem',
      dataIndex: 'lastProcessed',
      key: 'lastProcessed',
      render: (date: string) => date ? dayjs(date).format('DD.MM.YYYY') : '-'
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: RecurringTransaction) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ color: '#4a7c59' }}
          />
          <Popconfirm
            title="Bu tekrarlanan işlemi silmek istediğinizden emin misiniz?"
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

  return (
    <Card 
      title="Tekrarlanan İşlemler" 
      style={{ marginBottom: '24px' }}
      headStyle={{ backgroundColor: '#4a7c59', color: 'white' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Açıklama"
              name="description"
              rules={[{ required: true, message: 'Lütfen açıklama giriniz!' }]}
            >
              <Input placeholder="Örn: Kira ödemesi" />
            </Form.Item>
          </Col>
          
          <Col span={4}>
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
          
          <Col span={4}>
            <Form.Item
              label="Kategori"
              name="categoryId"
              rules={[{ required: true, message: 'Lütfen kategori seçiniz!' }]}
            >
              <Select placeholder="Seçiniz">
                {categories.map(category => (
                  <Option key={category.id} value={category.id}>
                    <span style={{ marginRight: '8px' }}>{category.icon}</span>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={4}>
            <Form.Item
              label="Hesap"
              name="accountId"
              rules={[{ required: true, message: 'Lütfen hesap seçiniz!' }]}
            >
              <Select placeholder="Seçiniz">
                {accounts.map(account => (
                  <Option key={account.id} value={account.id}>
                    {account.accountName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={4}>
            <Form.Item
              label="Başlangıç"
              name="startDate"
              rules={[{ required: true, message: 'Lütfen başlangıç tarihi seçiniz!' }]}
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD.MM.YYYY"
                placeholder="gg.aa.yyyy"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              label="Sıklık"
              name="frequency"
              rules={[{ required: true, message: 'Lütfen sıklık seçiniz!' }]}
            >
              <Select placeholder="Seçiniz">
                <Option value="günlük">Günlük</Option>
                <Option value="haftalık">Haftalık</Option>
                <Option value="aylık">Aylık</Option>
                <Option value="yıllık">Yıllık</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={6}>
            <Form.Item
              label="İşlem Türü"
              name="isIncome"
              rules={[{ required: true, message: 'Lütfen işlem türü seçiniz!' }]}
            >
              <Radio.Group>
                <Radio value={false}>Gider</Radio>
                <Radio value={true}>Gelir</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          
          <Col span={6}>
            <Form.Item
              label="Durum"
              name="isActive"
              rules={[{ required: true, message: 'Lütfen durum seçiniz!' }]}
            >
              <Radio.Group>
                <Radio value={true}>Aktif</Radio>
                <Radio value={false}>Pasif</Radio>
              </Radio.Group>
            </Form.Item>
          </Col>
          
          <Col span={6}>
            <Form.Item label=" " style={{ marginTop: '29px' }}>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<PlusOutlined />}
                  style={{ backgroundColor: '#4a7c59', borderColor: '#4a7c59' }}
                >
                  {editingId ? 'Güncelle' : 'Ekle'}
                </Button>
                {editingId && (
                  <Button onClick={cancelEdit}>
                    İptal
                  </Button>
                )}
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Table
        columns={columns}
        dataSource={recurringTransactions}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true
        }}
        scroll={{ x: 1200 }}
      />
    </Card>
  );
};

export default RecurringTransactions;
