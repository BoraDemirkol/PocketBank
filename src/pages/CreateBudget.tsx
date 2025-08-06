// src/pages/CreateBudget.tsx
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

// Adım başlıkları
const steps = ['Genel Bilgiler', 'Kategori Limitleri', 'Özet & Kaydet'];

type Period = 'monthly' | 'yearly';
interface CategoryInput { name: string; limit: number; spent?: number; }

// Önceden tanımlı şablonlar
const budgetTemplates: { name: string; categories: Omit<CategoryInput, 'spent'>[] }[] = [
  {
    name: 'Öğrenci',
    categories: [
      { name: 'Yemek', limit: 1000 },
      { name: 'Ulaşım', limit: 500 },
      { name: 'Eğlence', limit: 300 }
    ]
  },
  {
    name: 'Çalışan',
    categories: [
      { name: 'Kira', limit: 3000 },
      { name: 'Market', limit: 1500 },
      { name: 'Faturalar', limit: 800 },
      { name: 'Tasarruf', limit: 1000 }
    ]
  },
  {
    name: 'Emekli',
    categories: [
      { name: 'Sağlık', limit: 1200 },
      { name: 'Giderler', limit: 1000 },
      { name: 'Hobi', limit: 400 }
    ]
  }
];

const CreateBudget: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [period, setPeriod] = useState<Period>('monthly');
  const [start, setStart] = useState<string>(new Date().toISOString().slice(0, 10));
  const [categories, setCategories] = useState<CategoryInput[]>([]);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatLimit, setNewCatLimit] = useState<number>(0);

  // Şablon seçildiğinde otomatik doldurma
  useEffect(() => {
    const tpl = budgetTemplates.find(t => t.name === selectedTemplate);
    if (tpl) {
      setName(`${tpl.name} Bütçesi`);
      setCategories(tpl.categories.map(c => ({ ...c, spent: 0 })));
    } else {
      setName('');
      setCategories([]);
    }
  }, [selectedTemplate]);

  const handleNext = () => setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
  const handleBack = () => setActiveStep(prev => Math.max(prev - 1, 0));

  const addCategory = () => {
    if (!newCatName || newCatLimit <= 0) return;
    setCategories(prev => [...prev, { name: newCatName, limit: newCatLimit, spent: 0 }]);
    setNewCatName('');
    setNewCatLimit(0);
  };

  const removeCategory = (idx: number) => {
    setCategories(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const staticUserId = 'df497fd5-57e9-4cef-ab49-5d1062e5a282';
    // Kategorileri al ve eşleştir
    const { data: allCats } = await supabase.from('categories').select('id, name');
    const catMap = new Map(allCats?.map(c => [c.name.toLowerCase(), c.id]));
    const invalid = categories.filter(c => !catMap.has(c.name.toLowerCase()));
    if (invalid.length) {
      alert(`Bulunamadı: ${invalid.map(i => i.name).join(', ')}`);
      setActiveStep(1);
      return;
    }
    const totalAmount = categories.reduce((sum, c) => sum + c.limit, 0);
    // Bütçe ekle
    const { data: bData, error: bErr } = await supabase
      .from('budgets')
      .insert([{ id: uuidv4(), user_id: staticUserId, name, amount: totalAmount, period, start_date: start, created_at: new Date().toISOString() }])
      .select('id')
      .single();
    if (bErr || !bData) { alert('Bütçe kaydedilemedi'); return; }
    // Kategori limitleri ekle
    for (const cat of categories) {
      await supabase.from('budget_categories').insert([{ id: uuidv4(), budget_id: bData.id, category_id: catMap.get(cat.name.toLowerCase()), limit: cat.limit, created_at: new Date().toISOString() }]);
    }
    alert('Bütçe başarılı kaydedildi!');
    // Reset
    setSelectedTemplate(''); setName(''); setPeriod('monthly'); setStart(new Date().toISOString().slice(0,10)); setCategories([]); setActiveStep(0);
  };



  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>➕ Bütçe Oluşturma Sihirbazı</Typography>
      <TextField
        select fullWidth label="Şablon Seç" value={selectedTemplate}
        onChange={e => setSelectedTemplate(e.target.value)} sx={{ mb:3 }}
      >
        <MenuItem value="">⦿ Şablonsuz Başla</MenuItem>
        {budgetTemplates.map(t => <MenuItem key={t.name} value={t.name}>{t.name}</MenuItem>)}
      </TextField>
      <Stepper activeStep={activeStep} sx={{ mb:3 }}>
        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {activeStep===0 && (
        <Box sx={{ display:'grid', gap:2 }}>
          <TextField label="Bütçe Adı" value={name} onChange={e=>setName(e.target.value)} fullWidth />
          <TextField select label="Periyot" value={period} onChange={e=>setPeriod(e.target.value as Period)}>
            <MenuItem value="monthly">Aylık</MenuItem>
            <MenuItem value="yearly">Yıllık</MenuItem>
          </TextField>
          <TextField label="Başlangıç" type="date" value={start} onChange={e=>setStart(e.target.value)} fullWidth />
          <Box sx={{ display:'flex', justifyContent:'flex-end' }}>
            <Button variant="contained" onClick={handleNext} disabled={!name||!start}>İleri</Button>
          </Box>
        </Box>
      )}

      {activeStep===1 && (
        <Box sx={{ display:'grid', gap:2 }}>
          <Box sx={{ display:'flex', gap:1, alignItems:'center' }}>
            <TextField label="Kategori Adı" value={newCatName} onChange={e=>setNewCatName(e.target.value)} />
            <TextField label="Limit" type="number" value={newCatLimit} onChange={e=>setNewCatLimit(+e.target.value)} sx={{ width:120 }} />
            <IconButton color="primary" onClick={addCategory}><Add/></IconButton>
          </Box>
          <List>
            {categories.map((cat, idx)=>(
              <React.Fragment key={idx}>
                <ListItem>
                  <ListItemText primary={cat.name} secondary={`Limit: ${cat.limit} TL`} />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={()=>removeCategory(idx)}><Delete/></IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider/>
              </React.Fragment>
            ))}
          </List>
          <Box sx={{ display:'flex', justifyContent:'space-between' }}>
            <Button onClick={handleBack}>Geri</Button>
            <Button variant="contained" onClick={handleNext} disabled={categories.length===0}>İleri</Button>
          </Box>
        </Box>
      )}

      {activeStep===2 && (
        <Box sx={{ display:'grid', gap:2 }}>
          <Typography variant="h6">Özet</Typography>
          <Typography><strong>Bütçe Adı:</strong> {name}</Typography>
          <Typography><strong>Periyot:</strong> {period==='monthly'? 'Aylık':'Yıllık'}</Typography>
          <Typography><strong>Başlangıç:</strong> {start}</Typography>
          <Typography variant="subtitle1" mt={2}>Kategoriler ve Limitleri:</Typography>
          <List>
            {categories.map((cat,idx)=>(<ListItem key={idx}><ListItemText primary={cat.name} secondary={`${cat.limit} TL`} /></ListItem>))}
          </List>
          <Box sx={{ display:'flex', justifyContent:'space-between' }}>
            <Button onClick={handleBack}>Geri</Button>
            <Button variant="contained" onClick={handleSave}>Bütçeyi Kaydet</Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default CreateBudget;