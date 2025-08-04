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

  // Hesaplama mantığı aynı kalıyor...
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
        feedback = 'Mükemmel!';
        tavsiye = 'Finansal durumunuz harika! Bu şekilde devam ederek birikim hedeflerinize hızla ulaşabilirsiniz.';
      } else if (birikimOrani > 0.1) {
        score = 70;
        feedback = 'Çok İyi';
        tavsiye = 'İyi bir birikim oranınız var. Harcamalarınızı biraz daha optimize ederek daha da iyi bir seviyeye gelebilirsiniz.';
      } else if (birikimOrani >= 0) {
        score = 50;
        feedback = 'Geliştirilebilir';
        tavsiye = 'Gelirinizin bir kısmını biriktirmeyi başarıyorsunuz. Bütçenizi gözden geçirerek gereksiz harcamaları tespit edebilirsiniz.';
      } else {
        score = 25;
        feedback = 'Dikkat Edilmeli';
        tavsiye = 'Harcamalarınız gelirinizden fazla. Harcama alışkanlıklarınızı acilen gözden geçirip bir bütçe planı oluşturmalısınız.';
      }
      setScoreData({ score, birikimOrani, feedback, tavsiye });
      setLoading(false);
    };
    calculateScore();
  }, []);

  // --- YENİ YEŞİL TEMA STİLLERİ ---
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
    backgroundColor: '#e8f5e9', // Very light green
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