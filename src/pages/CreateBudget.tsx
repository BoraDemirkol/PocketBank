import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Paper,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

type Period = 'monthly' | 'yearly';
interface Category {
  name: string;
  limit: number;
}

const steps = ['Genel Bilgiler', 'Kategori Limitleri', 'Özet & Kaydet'];

const CreateBudget: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [period, setPeriod] = useState<Period>('monthly');
  const [start, setStart] = useState<string>(new Date().toISOString().slice(0, 10));
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState<number>(0);

  const handleNext = () => {
    if (activeStep < steps.length - 1) setActiveStep(prev => prev + 1);
  };
  const handleBack = () => {
    if (activeStep > 0) setActiveStep(prev => prev - 1);
  };

  const addCategory = () => {
    if (!newCatName || newCatLimit <= 0) return;
    setCategories(prev => [...prev, { name: newCatName, limit: newCatLimit }]);
    setNewCatName('');
    setNewCatLimit(0);
  };
  const removeCategory = (index: number) => {
    setCategories(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const staticUserId = 'df497fd5-57e9-4cef-ab49-5d1062e5a282';

    // Step 1: Fetch all categories first
    const { data: allCategories, error: categoryError } = await supabase
      .from('categories')
      .select('id, name');

    if (categoryError || !allCategories) {
      alert('Kategori verileri alınamadı.');
      return;
    }

    const categoryMap = new Map(allCategories.map(cat => [cat.name.toLowerCase(), cat.id]));

    // Step 2: Validate all category names exist before inserting budget
    const invalidCategories = categories.filter(cat => !categoryMap.has(cat.name.trim().toLowerCase()));
    if (invalidCategories.length > 0) {
      alert(`Bazı kategoriler bulunamadı: ${invalidCategories.map(c => `'${c.name}'`).join(', ')}.\nLütfen tekrar düzenleyin.`);
      setActiveStep(1); // go back to category entry step
      return;
    }

    // Step 3: Calculate total amount
    const totalAmount = categories.reduce((sum, c) => sum + c.limit, 0);

    // Step 4: Insert budget only if validation passed
    const { data: budgetInsert, error: budgetError } = await supabase
      .from('budgets')
      .insert({
        id: uuidv4(),
        user_id: staticUserId,
        name,
        amount: totalAmount,
        period,
        start_date: start,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (budgetError || !budgetInsert) {
      console.error(budgetError);
      alert('Bütçe kaydedilemedi.');
      return;
    }

    const budgetId = budgetInsert.id;

    // Step 5: Insert budget categories
    for (const cat of categories) {
      const categoryId = categoryMap.get(cat.name.trim().toLowerCase());
      const { error: insertError } = await supabase
        .from('budget_categories')
        .insert({
          id: uuidv4(),
          budget_id: budgetId,
          category_id: categoryId,
          limit: cat.limit,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error(insertError);
        alert(`Kategori limiti kaydedilemedi: ${cat.name}`);
      }
    }

    // Step 6: Reset form and notify success
    setName('');
    setPeriod('monthly');
    setStart(new Date().toISOString().slice(0, 10));
    setCategories([]);
    setActiveStep(0);
    alert('Bütçe başarıyla kaydedildi!');
  };



  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Bütçe Oluşturma Sihirbazı
      </Typography>
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label="Bütçe Adı"
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
          />
          <TextField
            select
            label="Periyot"
            value={period}
            onChange={e => setPeriod(e.target.value as Period)}
          >
            <MenuItem value="monthly">Aylık</MenuItem>
            <MenuItem value="yearly">Yıllık</MenuItem>
          </TextField>
          <TextField
            label={period === 'monthly' ? 'Başlangıç (YYYY-MM-DD)' : 'Başlangıç Yılı (YYYY)'}
            type="date"
            value={start}
            onChange={e => setStart(e.target.value)}
            fullWidth
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={handleNext} disabled={!name || !start}>
              İleri
            </Button>
          </Box>
        </Box>
      )}

      {activeStep === 1 && (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label="Kategori Adı"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
            />
            <TextField
              label="Limit"
              type="number"
              value={newCatLimit}
              onChange={e => setNewCatLimit(Number(e.target.value))}
            />
            <IconButton color="primary" onClick={addCategory}>
              <Add />
            </IconButton>
          </Box>
          <List>
            {categories.map((cat, idx) => (
              <React.Fragment key={idx}>
                <ListItem>
                  <ListItemText primary={cat.name} secondary={`Limit: ${cat.limit} TL`} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => removeCategory(idx)}>
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={handleBack}>Geri</Button>
            <Button variant="contained" onClick={handleNext} disabled={categories.length === 0}>
              İleri
            </Button>
          </Box>
        </Box>
      )}

      {activeStep === 2 && (
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Typography variant="h6">Özet</Typography>
          <Typography><strong>Bütçe Adı:</strong> {name}</Typography>
          <Typography><strong>Periyot:</strong> {period === 'monthly' ? 'Aylık' : 'Yıllık'}</Typography>
          <Typography><strong>Başlangıç:</strong> {start}</Typography>
          <Typography variant="subtitle1">Kategoriler ve Limitleri:</Typography>
          <List>
            {categories.map((cat, idx) => (
              <ListItem key={idx}>
                <ListItemText primary={cat.name} secondary={`${cat.limit} TL`} />
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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