# PocketBank - Kişisel Finans Yönetimi

Bu proje, kişisel finans yönetimi için geliştirilmiş bir React uygulamasıdır. Hem .NET backend hem de Supabase veritabanı desteği sunar.

## Özellikler

- 💰 İşlem yönetimi (ekleme, düzenleme, silme)
- 📊 Kategori yönetimi
- 🏦 Hesap yönetimi
- 🔄 Tekrarlayan işlemler
- 📁 Fiş yükleme ve görüntüleme
- 📈 İşlem filtreleme ve arama
- 📥 CSV/Excel dosya içe aktarma
- 🏦 Banka hesap özeti içe aktarma
- 📤 CSV/Excel dışa aktarma
- 🌙 Tema desteği (Açık/Koyu)

## Teknolojiler

- **Frontend**: React 19, TypeScript, CSS
- **Backend**: .NET 8, Entity Framework Core
- **Veritabanı**: SQL Server (Backend), Supabase (PostgreSQL)
- **Dosya Yönetimi**: Supabase Storage
- **Kimlik Doğrulama**: Supabase Auth

## Kurulum

### 1. Gereksinimler

- Node.js 18+
- .NET 8 SDK
- Supabase hesabı

### 2. Proje Kurulumu

```bash
# Repository'yi klonlayın
git clone https://github.com/BoraDemirkol/PocketBank.git
cd PocketBank

# Frontend bağımlılıklarını yükleyin
npm install

# Backend bağımlılıklarını yükleyin
cd src/modules/backend
dotnet restore
```

### 3. Supabase Kurulumu

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. SQL Editor'de `supabase_schema.sql` dosyasını çalıştırın
4. Storage bucket oluşturun:
   - Bucket adı: `receipts`
   - Public bucket olarak ayarlayın

### 4. Environment Variables

`.env` dosyası oluşturun:

```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Uygulamayı Çalıştırma

```bash
# Backend'i başlatın
cd src/modules/backend
dotnet run

# Yeni terminal'de frontend'i başlatın
npm start
```

## Supabase Entegrasyonu

Bu proje hem .NET backend hem de Supabase veritabanını destekler:

### Veritabanı Şeması

- **users**: Kullanıcı bilgileri
- **categories**: İşlem kategorileri
- **accounts**: Banka hesapları
- **transactions**: İşlem kayıtları
- **recurring_transactions**: Tekrarlayan işlemler
- **budgets**: Bütçe planları

### Güvenlik

- Row Level Security (RLS) aktif
- Kullanıcı bazlı veri erişimi
- Supabase Auth entegrasyonu

### Dosya Yönetimi

- Supabase Storage kullanımı
- Fiş yükleme ve görüntüleme
- Otomatik dosya organizasyonu

## API Endpoints

### Backend (.NET)

- `GET /api/transaction` - İşlemleri listele
- `POST /api/transaction` - İşlem ekle
- `PUT /api/transaction/{id}` - İşlem güncelle
- `DELETE /api/transaction/{id}` - İşlem sil
- `GET /api/categories` - Kategorileri listele
- `POST /api/categories` - Kategori ekle
- `GET /api/accounts` - Hesapları listele
- `POST /api/accounts` - Hesap ekle

### Supabase

Tüm CRUD işlemleri Supabase servisleri üzerinden yapılır:

```typescript
import { supabaseTransactionService } from './services/supabaseService';

// İşlem ekleme
const transaction = await supabaseTransactionService.addTransaction({
    accountId: 'account-id',
    categoryId: 'category-id',
    amount: 100,
    transactionDate: '2024-01-01',
    description: 'Market alışverişi'
});
```

## Geliştirme

### Yeni Özellik Ekleme

1. TypeScript tiplerini `src/types/index.ts`'de tanımlayın
2. Supabase servisini `src/services/supabaseService.ts`'de ekleyin
3. UI bileşenini ilgili modülde oluşturun

### Veritabanı Değişiklikleri

1. `supabase_schema.sql` dosyasını güncelleyin
2. Supabase SQL Editor'de çalıştırın
3. TypeScript tiplerini güncelleyin

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## İletişim

Bora Demirkol - [@BoraDemirkol](https://github.com/BoraDemirkol)

Proje Linki: [https://github.com/BoraDemirkol/PocketBank](https://github.com/BoraDemirkol/PocketBank)
