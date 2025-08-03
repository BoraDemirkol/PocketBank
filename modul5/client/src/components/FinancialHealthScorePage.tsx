import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// --- Arayüz Tipleri ---
interface ScoreData {
  score: number;
  birikimOrani: number;
  feedback: string;
  tavsiye: string;
}

// Kalp animasyonu için tip
interface Heart {
  id: number;
  left: number;
  bottom: number;
  size: number;
  opacity: number;
  duration: number;
}


const FinancialHealthScorePage = () => {
  // --- State Değişkenleri ---
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hearts, setHearts] = useState<Heart[]>([]);


  // --- Tema ve Stil Objeleri ---
  const theme = {
    bg: '#fff0f5', // lavenderblush
    cardBg: '#ffffff',
    primary: '#9c27b0', // Mor
    secondary: '#e91e63', // Canlı Pembe
    accent: '#fce4ec', // Çok Açık Pembe
    textPrimary: '#6a1b9a', // Koyu Mor
    textSecondary: '#ad1457', // Koyu Pembe
    shadow: 'rgba(233, 30, 99, 0.2)',
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: theme.bg,
    padding: '40px 20px',
    maxWidth: '600px',
    margin: '20px auto',
    textAlign: 'center',
    borderRadius: '25px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    position: 'relative',
    overflow: 'hidden',
    border: `1px solid ${theme.accent}`
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.accent}`,
    borderRadius: '20px',
    padding: '30px',
    boxShadow: `0 8px 25px ${theme.shadow}`,
  };

  const scoreWrapperStyle: React.CSSProperties = {
    background: `radial-gradient(closest-side, ${theme.cardBg} 79%, transparent 80% 100%),
                 conic-gradient(${theme.secondary} ${scoreData?.score || 0}%, ${theme.accent} 0)`,
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px auto',
    transition: 'transform 0.5s ease'
  };

  // --- Kalp Animasyonunu Başlatan Fonksiyon ---
  const triggerHeartExplosion = () => {
    const newHearts: Heart[] = [];
    for (let i = 0; i < 20; i++) {
      newHearts.push({
        id: Math.random(),
        left: Math.random() * 100, // % olarak yatay pozisyon
        bottom: -20, // Ekranın altından başla
        size: Math.random() * 15 + 8, // 8px ile 23px arası boyut
        opacity: 1,
        duration: Math.random() * 1 + 1.5, // 1.5s ile 2.5s arası animasyon süresi
      });
    }
    setHearts(newHearts);

    // Kalpleri yukarı fırlat ve sonra kaybet
    setTimeout(() => {
        setHearts(currentHearts => currentHearts.map(h => ({
            ...h,
            bottom: 120, // Ekranın %120 üstüne çık
            opacity: 0
        })));
    }, 100);

    // DOM'dan temizle
    setTimeout(() => {
        setHearts([]);
    }, 3000); // Animasyon bittikten sonra temizle
  };

  
  // --- Veri Çekme ve Hesaplama Mantığı ---
  useEffect(() => {
    const calculateScore = async () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: transactions, error: fetchError } = await supabase
        .from('transactions')
        .select('amount')
        .gte('transaction_date', ninetyDaysAgo.toISOString());

      if (fetchError) {
        setError('Veriler yüklenirken bir hata oluştu.');
        setLoading(false);
        return;
      }

      if (!transactions || transactions.length === 0) {
        setError('Skor hesaplamak için son 90 günde yeterli veri bulunamadı.');
        setLoading(false);
        return;
      }

      let totalGelir = 0;
      let totalGider = 0;
      transactions.forEach(t => {
        if (t.amount > 0) { totalGelir += t.amount; }
        else { totalGider += Math.abs(t.amount); }
      });

      if (totalGelir === 0) {
        setError('Skor hesaplamak için gelir verisi bulunamadı.');
        setLoading(false);
        return;
      }
      
      const birikimOrani = ((totalGelir - totalGider) / totalGelir);
      let score = 0;
      let feedback = '';
      let tavsiye = '';

      if (birikimOrani > 0.2) {
        score = 90;
        feedback = 'Mükemmelsin';
        tavsiye = 'Finansal durumun harika! 💖';
      } else if (birikimOrani > 0.1) {
        score = 70;
        feedback = 'Çok İyisin!';
        tavsiye = 'İyi bir birikim oranın var.';
      } else if (birikimOrani >= 0) {
        score = 50;
        feedback = 'Daha İyi Olabilir';
        tavsiye = 'Birikim yapmaya başlamışsın, bu harika! Bütçenizi gözden geçirerek gereksiz harcamaları bulup hedeflerine odaklanabilirsin.';
      } else {
        score = 25;
        feedback = 'Biraz Dikkat Etmelisin';
        tavsiye = 'Harcamaların gelirinden fazla görünüyor. Endişelenme, harcama alışkanlıklarını takip ederek kontrolü eline alabilirsin.';
      }

      setScoreData({ score, birikimOrani, feedback, tavsiye });
      setLoading(false);
      triggerHeartExplosion(); // Veri gelince animasyonu tetikle
    };

    calculateScore();
  }, []);


  return (
    <div style={containerStyle}>
      {/* Kalp animasyonu için oluşturulan elementler */}
      {hearts.map(heart => (
        <div key={heart.id} style={{
            position: 'absolute',
            left: `${heart.left}%`,
            bottom: `${heart.bottom}%`,
            fontSize: `${heart.size}px`,
            color: theme.secondary,
            opacity: heart.opacity,
            transition: `all ${heart.duration}s cubic-bezier(0.175, 0.885, 0.32, 1.275)`, // Yumuşak fırlama efekti
            pointerEvents: 'none'
        }}>
            💖
        </div>
      ))}

      {loading && <p style={{ color: theme.primary }}>Finansal sağlık skorun hesaplanıyor canım...</p>}
      
      {error && <p style={{ color: theme.textSecondary }}>{error}</p>}
      
      {scoreData && !loading && !error && (
        <div style={cardStyle}>
          
          <div style={scoreWrapperStyle}>
              <span style={{ fontSize: '2.5em', fontWeight: 'bold', color: theme.primary }}>
                ✨ {scoreData.score} ✨
              </span>
          </div>

          <h2 style={{ fontSize: '2.5em', margin: '0 0 10px 0', color: theme.primary }}>{scoreData.feedback}</h2>
          
          <p style={{ fontSize: '1.1em', color: theme.textPrimary, margin: '0' }}>
            Son 90 günlük birikim oranınız: 
            <strong> %{(scoreData.birikimOrani * 100).toFixed(1)}</strong>
          </p>

          <hr style={{ margin: '30px 0', border: 'none', borderTop: `1px solid ${theme.accent}` }} />

          <div style={{ backgroundColor: theme.accent, padding: '20px', borderRadius: '8px', textAlign: 'left', borderLeft: `5px solid ${theme.secondary}` }}>
            <h4 style={{ marginTop: 0, color: theme.textSecondary }}>Sana Özel Tavsiye:</h4>
            <p style={{ color: theme.textSecondary, fontWeight: 500 }}>{scoreData.tavsiye}</p>
          </div>

        </div>
      )}
    </div>
  );
};

export default FinancialHealthScorePage;