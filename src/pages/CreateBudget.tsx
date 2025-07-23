import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  MenuItem
} from '@mui/material';

interface Category {
  name: string;
  limit: number;
}

interface BudgetFormData {
  name: string;
  amount: number;
  period: string;
  startDate: string;
  endDate: string;
  spent: number; // Harcama takibi için eklendi
  categories: Category[];
}

const steps = ['Bütçe Bilgisi', 'Kategoriler'];

const CreateBudget: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<BudgetFormData>({
    name: '',
    amount: 0,
    period: 'monthly',
    startDate: '',
    endDate: '',
    spent: 0,
    categories: [],
  });
  const [newCategory, setNewCategory] = useState<Category>({
    name: '',
    limit: 0,
  });

  const handleNext = () => {
    if (activeStep === 0 && formData.startDate) {
      const start = new Date(formData.startDate);
      const end = new Date(start);
      if (formData.period === 'monthly') {
        end.setMonth(end.getMonth() + 1);
      } else if (formData.period === 'yearly') {
        end.setFullYear(end.getFullYear() + 1);
      }
      setFormData((prev) => ({
        ...prev,
        endDate: end.toISOString().split('T')[0],
      }));
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleCategoryAdd = () => {
    if (newCategory.name && newCategory.limit > 0) {
      setFormData((prev) => ({
        ...prev,
        categories: [...prev.categories, newCategory],
      }));
      setNewCategory({ name: '', limit: 0 });
    }
  };

  const handleSubmit = () => {
    console.log('Bütçe verileri:', formData);
    alert('Bütçe başarıyla oluşturuldu!');
    setActiveStep(0);
    setFormData({
      name: '',
      amount: 0,
      period: 'monthly',
      startDate: '',
      endDate: '',
      spent: 0,
      categories: [],
    });
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        Bütçe Oluştur
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Bütçe Adı"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            label="Toplam Tutar (TL)"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: +e.target.value })}
          />
          <TextField
            select
            label="Dönem"
            value={formData.period}
            onChange={(e) => setFormData({ ...formData, period: e.target.value })}
          >
            <MenuItem value="monthly">Aylık</MenuItem>
            <MenuItem value="yearly">Yıllık</MenuItem>
          </TextField>
          <TextField
            label="Başlangıç Tarihi"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          {formData.endDate && (
            <Typography variant="body2" color="textSecondary">
              Bitiş Tarihi: {formData.endDate}
            </Typography>
          )}
          <Button variant="contained" onClick={handleNext} disabled={!formData.startDate}>
            İleri
          </Button>
        </Box>
      )}

      {activeStep === 1 && (
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Kategori Adı"
            value={newCategory.name}
            onChange={(e) =>
              setNewCategory({ ...newCategory, name: e.target.value })
            }
          />
          <TextField
            label="Limit (TL)"
            type="number"
            value={newCategory.limit}
            onChange={(e) =>
              setNewCategory({ ...newCategory, limit: +e.target.value })
            }
          />
          <Button variant="outlined" onClick={handleCategoryAdd}>
            Kategori Ekle
          </Button>

          {formData.categories.map((cat, i) => (
            <Typography key={i}>
              ✅ {cat.name} - {cat.limit} TL
            </Typography>
          ))}

          <Box display="flex" justifyContent="space-between">
            <Button onClick={handleBack}>Geri</Button>
            <Button variant="contained" onClick={handleSubmit}>
              Bütçeyi Kaydet
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default CreateBudget;
