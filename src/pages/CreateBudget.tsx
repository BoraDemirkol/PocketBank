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

// Budget and Category types
type Period = 'monthly' | 'yearly';
interface Category {
  name: string;
  limit: number;
}
interface Budget {
  id: string;
  name: string;
  period: Period;
  start: string; // YYYY-MM
  categories: Category[];
  createdAt: string;
}

// Utility for localStorage
const storageKey = 'pocketbank_budgets';
const loadBudgets = (): Budget[] => {
  const json = localStorage.getItem(storageKey);
  return json ? JSON.parse(json) : [];
};
const saveBudgets = (budgets: Budget[]) => {
  localStorage.setItem(storageKey, JSON.stringify(budgets));
};

const steps = ['Genel Bilgiler', 'Kategori Limitleri', 'Özet & Kaydet'];

const CreateBudget: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  // Step 1
  const [name, setName] = useState('');
  const [period, setPeriod] = useState<Period>('monthly');
  const [start, setStart] = useState<string>(new Date().toISOString().slice(0,7));
  // Step 2
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState<number>(0);

  useEffect(() => {
    // initialize storage if empty
    if (!localStorage.getItem(storageKey)) saveBudgets([]);
  }, []);

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

  const handleSubmit = () => {
    const budgets = loadBudgets();
    const newBudget: Budget = {
      id: Date.now().toString(),
      name,
      period,
      start,
      categories,
      createdAt: new Date().toISOString()
    };
    saveBudgets([...budgets, newBudget]);
    // reset wizard
    setName('');
    setPeriod('monthly');
    setStart(new Date().toISOString().slice(0,7));
    setCategories([]);
    setActiveStep(0);
    alert('Bütçe kaydedildi!');
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

      {/* Step Content */}
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
            label={period === 'monthly' ? 'Başlangıç (YYYY-MM)' : 'Başlangıç Yılı (YYYY)'}
            type="month"
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
