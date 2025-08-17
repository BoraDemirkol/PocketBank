import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, Card, Row, Col, Popconfirm, message, ColorPicker, Select, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { Category } from '../../types/transaction';
import { apiService } from '../../api';

const { Option } = Select;

interface CategoryManagementProps {
  onCategoryAdded: () => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({ onCategoryAdded }) => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiService.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Kategoriler yüklenirken hata oluştu');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      if (editingId) {
        await apiService.put(`/categories/${editingId}`, values);
        message.success('Kategori başarıyla güncellendi!');
        setEditingId(null);
      } else {
        await apiService.post('/categories', values);
        message.success('Kategori başarıyla eklendi!');
      }
      
      form.resetFields();
      fetchCategories();
      onCategoryAdded();
      
    } catch (error) {
      console.error('Error saving category:', error);
      message.error('Kategori kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    form.setFieldsValue({
      name: category.name,
      icon: category.icon,
      color: category.color
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`http://localhost:5271/api/categories/${id}`, {
        method: 'DELETE',
        headers: await apiService.getAuthHeaders(),
      });
      message.success('Kategori başarıyla silindi!');
      fetchCategories();
      onCategoryAdded();
    } catch (error) {
      console.error('Error deleting category:', error);
      message.error('Kategori silinirken hata oluştu');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.resetFields();
  };

  const columns = [
    {
      title: 'İkon',
      dataIndex: 'icon',
      key: 'icon',
      render: (icon: string) => icon || '📁'
    },
    {
      title: 'Ad',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Renk',
      dataIndex: 'color',
      key: 'color',
      render: (color: string) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div 
            style={{ 
              width: '20px', 
              height: '20px', 
              backgroundColor: color || '#4a7c59', 
              borderRadius: '4px',
              marginRight: '8px'
            }} 
          />
          {color || '#4a7c59'}
        </div>
      )
    },
    {
      title: 'İşlemler',
      key: 'actions',
      render: (record: Category) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ color: '#4a7c59' }}
          />
          <Popconfirm
            title="Bu kategoriyi silmek istediğinizden emin misiniz?"
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
        </div>
      )
    }
  ];

  return (
    <Card 
      title="Kategori Yönetimi" 
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
          <Col span={6}>
            <Form.Item
              label="Kategori Adı"
              name="name"
              rules={[{ required: true, message: 'Lütfen kategori adı giriniz!' }]}
            >
              <Input placeholder="Örn: Market" />
            </Form.Item>
          </Col>
          
          <Col span={6}>
            <Form.Item
              label="İkon"
              name="icon"
            >
              <Select placeholder="İkon seçiniz">
                <Option value="🛒">🛒 Market</Option>
                <Option value="🍔">🍔 Yemek</Option>
                <Option value="🚕">🚕 Ulaşım</Option>
                <Option value="💡">💡 Fatura</Option>
                <Option value="🏠">🏠 Kira</Option>
                <Option value="🎬">🎬 Eğlence</Option>
                <Option value="🏥">🏥 Sağlık</Option>
                <Option value="📚">📚 Eğitim</Option>
                <Option value="👕">👕 Giyim</Option>
                <Option value="💻">💻 Elektronik</Option>
                <Option value="🏦">🏦 Banka</Option>
                <Option value="💰">💰 Gelir</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={6}>
            <Form.Item
              label="Renk"
              name="color"
            >
              <ColorPicker defaultValue="#4a7c59" />
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
        dataSource={categories}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true
        }}
      />
    </Card>
  );
};

export default CategoryManagement;
