import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Tahmin verisinin formatını tanımlayalım
interface ForecastData {
  tahminiGelir: number;
  tahminiGider: number;
  tahminiBirikim: number;
}

const ForecastCard = () => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateForecast = async () => {
      // 1. Supabase'den veriyi çek
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('amount, transaction_date');

      if (error) {
        console.error('Tahmin için veri çekerken hata:', error);
        setLoading(false);
        return;
      }

      if (transactions) {
        // 2. Veriyi aylara göre grupla (Bu kodu IncomeExpenseChart'tan aldık)
        const monthlySummary: { [key: string]: { gelir: number; gider: number } } = {};
        transactions.forEach((transaction: any) => {
          const date = new Date(transaction.transaction_date);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`; // Ayları yıl ile birlikte anahtar yapalım
          const amount = transaction.amount;

          if (!monthlySummary[monthKey]) {
            monthlySummary[monthKey] = { gelir: 0, gider: 0 };
          }
          if (amount > 0) {
            monthlySummary[monthKey].gelir += amount;
          } else {
            monthlySummary[monthKey].gider += Math.abs(amount);
          }
        });

        // 3. Son 3 ayın verisini al ve ortalamasını hesapla
        const lastThreeMonths = Object.values(monthlySummary).slice(-3);

        if (lastThreeMonths.length > 0) {
          const totalGelir = lastThreeMonths.reduce((sum, month) => sum + month.gelir, 0);
          const totalGider = lastThreeMonths.reduce((sum, month) => sum + month.gider, 0);

          const avgGelir = totalGelir / lastThreeMonths.length;
          const avgGider = totalGider / lastThreeMonths.length;

          setForecast({
            tahminiGelir: avgGelir,
            tahminiGider: avgGider,
            tahminiBirikim: avgGelir - avgGider,
          });
        }
      }
      setLoading(false);
    };

    calculateForecast();
  }, []);

  // Stil tanımlamaları
  const cardStyle: React.CSSProperties = {
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    backgroundColor: '#f9f9f9',
    width: '300px',
    marginTop: '20px'
  };
  const valueStyle = (value: number): React.CSSProperties => ({
    fontSize: '1.5em',
    fontWeight: 'bold',
    color: value >= 0 ? '#28a745' : '#dc3545', // Birikim pozitifse yeşil, negatifse kırmızı
  });


  if (loading) {
    return <div style={cardStyle}>Tahminler hesaplanıyor...</div>;
  }

  if (!forecast) {
    return <div style={cardStyle}>Tahmin için yeterli veri bulunamadı.</div>;
  }

  return (
    <div style={cardStyle}>
      <h3 style={{ marginTop: 0 }}>Gelecek Ay Tahmini</h3>
      <div style={{ marginBottom: '15px' }}>
        <span>Tahmini Gelir:</span>
        <div style={valueStyle(forecast.tahminiGelir)}>{forecast.tahminiGelir.toFixed(2)} TL</div>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <span>Tahmini Gider:</span>
        <div style={valueStyle(-1)}>{forecast.tahminiGider.toFixed(2)} TL</div> {/* Gideri kırmızı göstermek için -1 kullandık */}
      </div>
      <div>
        <span>Tahmini Birikim:</span>
        <div style={valueStyle(forecast.tahminiBirikim)}>{forecast.tahminiBirikim.toFixed(2)} TL</div>
      </div>
    </div>
  );
};

export default ForecastCard;