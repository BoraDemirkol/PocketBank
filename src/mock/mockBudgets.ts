export const mockBudgets = [
    {
      id: '1',
      name: 'Temmuz Bütçesi',
      amount: 10000,
      spent: 7600,
      categories: [
        { name: 'Market', limit: 3000, spent: 2800 },
        { name: 'Ulaşım', limit: 1000, spent: 1200 },
        { name: 'Eğlence', limit: 1500, spent: 800 }
      ],
      period: 'monthly',
      startDate: '2025-07-01'
    }, 
    {
      id: '1',
      name: 'Ağustos Bütçesi',
      amount: 10000,
      spent: 7600,
      categories: [
        { name: 'Market', limit: 3000, spent: 1800 },
        { name: 'Ulaşım', limit: 1000, spent: 200 },
        { name: 'Eğlence', limit: 1500, spent: 2000 },
        { name: 'Sağlık', limit: 2000, spent: 1900 }
      ],
      period: 'monthly',
      startDate: '2025-07-01'
    }
  ];
  