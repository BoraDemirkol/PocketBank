import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// State'lerimizin tiplerini tanımlayalım
interface ScoreData {
  score: number;
  birikimOrani: number;
  feedback: string;
  tavsiye: string;
}

const FinancialHealthScorePage = () => {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateScore = async () => {
      // Son 90 günün tarihini hesapla
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      // 1. Son 90 günlük işlemleri çek
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

      // 2. Gelir ve giderleri hesapla
      let totalGelir = 0;
      let totalGider = 0;

      transactions.forEach(t => {
        if (t.amount > 0) {
          totalGelir += t.amount;
        } else {
          totalGider += Math.abs(t.amount);
        }
      });

      if (totalGelir === 0) {
        setError('Skor hesaplamak için gelir verisi bulunamadı.');
        setLoading(false);
        return;
      }
      
      // --- YENİ, DAHA SERT VE GERÇEKÇİ PUANLAMA ALGORİTMASI ---
      const birikimOrani = ((totalGelir - totalGider) / totalGelir);
      let score = 0;

      if (birikimOrani >= 0.80) { // %80 ve üzeri birikim
        score = 100;
      } else if (birikimOrani >= 0.65) { // %65 - %79 arası
        score = 80 + ((birikimOrani - 0.65) / 0.15) * 10; // 80-90 arası
      } else if (birikimOrani >= 0.45) { // %45 - %64 arası
        score = 60 + ((birikimOrani - 0.45) / 0.20) * 20; // 60-80 arası
      } else if (birikimOrani >= 0.30) { // %30 - %44 arası
        score = 40 + ((birikimOrani - 0.30) / 0.15) * 20; // 40-60 arası
      } else if (birikimOrani >= 0.15) { // %15 - %29 arası
        score = 20 + ((birikimOrani - 0.15) / 0.15) * 20; // 20-40 arası
      } else { // %15'ten az (negatif dahil)
        score = Math.max(0, (birikimOrani / 0.15) * 20); // 0-20 arası
      }
      
      // Puanı 0 ile 100 arasında sınırla ve en yakın tam sayıya yuvarla
      score = Math.round(Math.max(0, Math.min(100, score)));

      let feedback = '';
      let tavsiye = '';

      if (score >= 90) {
        feedback = 'Harika!';
        tavsiye = 'Mükemmel bir birikim oranınız var! Finansal disiplininiz sayesinde hedeflerinize hızla yaklaşıyorsunuz.';
      } else if (score >= 80) {
        feedback = 'Çok Başarılı';
        tavsiye = 'Finansal durumunuz harika! Önerilen birikim oranının üzerindesiniz, bu şekilde devam ederek finansal geleceğinizi güvence altına alıyorsunuz.';
      } else if (score >= 60) {
        feedback = 'İyi Yoldasınız';
        tavsiye = 'İyi bir birikim oranınız var. Bu harika bir başarı! Bütçenizi gözden geçirerek bu oranı daha da artırmayı hedefleyebilirsiniz.';
      } else if (score >= 40) {
        feedback = 'Dengeli';
        tavsiye = 'Birikim ve harcamalarınız arasında bir denge kurmaya çalışıyorsunuz. Bu oranı artırmak için küçük adımlar atabilirsiniz.';
      } else if (score > 0) {
        feedback = 'Pozitif Adım';
        tavsiye = 'Birikim yapmaya başlamanız harika bir ilk adım. Bütçenizi gözden geçirerek gereksiz harcamaları tespit edebilir ve birikiminizi artırabilirsiniz.';
      } else {
        feedback = 'Gözden Geçirilmeli';
        tavsiye = 'Harcamalarınız gelirinizden fazla görünüyor. Harcama alışkanlıklarınızı ve bütçenizi gözden geçirerek finansal dengenizi yeniden kurabilirsiniz.';
      }

      setScoreData({ score, birikimOrani, feedback, tavsiye });
      setLoading(false);
    };

    calculateScore();
  }, []);

  // Stil tanımlamaları aynı kalıyor...
  const scoreCardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-surface, white)',
    borderRadius: 'var(--border-radius, 8px)',
    padding: '30px',
    boxShadow: 'var(--box-shadow, 0 4px 12px rgba(0,0,0,0.08))',
    maxWidth: '600px',
    margin: '20px auto',
    textAlign: 'center',
    border: '1px solid var(--color-accent, #a5d6a7)'
  };

  const gaugeStyle = (score: number): React.CSSProperties => ({
    background: `radial-gradient(closest-side, var(--color-surface, white) 79%, transparent 80% 100%),
                 conic-gradient(var(--color-primary, #2e7d32) ${score}%, var(--color-accent, #a5d6a7) 0)`,
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px auto',
  });

  const scoreTextStyle: React.CSSProperties = {
    fontSize: '3em',
    fontWeight: 'bold',
    color: 'var(--color-primary, #2e7d32)',
  };

  const recommendationBoxStyle: React.CSSProperties = {
    backgroundColor: '#e8f5e9',
    padding: '20px',
    borderRadius: 'var(--border-radius, 8px)',
    textAlign: 'left',
    marginTop: '30px',
    borderLeft: '5px solid var(--color-secondary, #66bb6a)'
  };

  return (
    <div>
      {loading && <p>Finansal sağlık skorunuz hesaplanıyor...</p>}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {scoreData && !loading && !error && (
        <div style={scoreCardStyle}>
          
          <div style={gaugeStyle(scoreData.score)}>
              <span style={scoreTextStyle}>
                {scoreData.score}
              </span>
          </div>

          <h2>{scoreData.feedback}</h2>
          
          <p style={{ color: 'var(--color-text-secondary, #4caf50)', margin: '0' }}>
            Son 90 günlük birikim oranınız: 
            <strong> %{(scoreData.birikimOrani * 100).toFixed(1)}</strong>
          </p>

          <div style={recommendationBoxStyle}>
            <h4 style={{ marginTop: 0 }}>Tavsiye:</h4>
            <p style={{ color: 'var(--color-text-primary, #1b5e20)' }}>{scoreData.tavsiye}</p>
          </div>

        </div>
      )}
    </div>
  );
};

export default FinancialHealthScorePage;