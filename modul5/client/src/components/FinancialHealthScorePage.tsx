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
        console.error('İşlemler çekilirken hata:', fetchError);
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
      
      // 3. Birikim oranını ve skoru hesapla
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
  }, []); // Boş dizi, bu fonksiyonun sadece bir kere çalışmasını sağlar

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      {loading && <p>Finansal sağlık skorunuz hesaplanıyor...</p>}
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {scoreData && !loading && !error && (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '30px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
          
          {/* Skor Göstergesi (CSS ile yapılmış) */}
          <div style={{
              background: `radial-gradient(closest-side, white 79%, transparent 80% 100%),
                           conic-gradient(#007bff ${scoreData.score}%, #e0e0e0 0)`,
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
          }}>
              <span style={{ fontSize: '3em', fontWeight: 'bold', color: '#007bff' }}>
                {scoreData.score}
              </span>
          </div>

          <h2 style={{ fontSize: '2.5em', margin: '0 0 10px 0' }}>{scoreData.feedback}</h2>
          
          <p style={{ fontSize: '1.1em', color: '#555', margin: '0' }}>
            Son 90 günlük birikim oranınız: 
            <strong> %{(scoreData.birikimOrani * 100).toFixed(1)}</strong>
          </p>

          <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />

          <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', textAlign: 'left' }}>
            <h4 style={{ marginTop: 0 }}>Tavsiye:</h4>
            <p style={{ color: '#333' }}>{scoreData.tavsiye}</p>
          </div>

        </div>
      )}
    </div>
  );
};

export default FinancialHealthScorePage;