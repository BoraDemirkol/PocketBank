import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // App Header
      "pocketbank": "PocketBank",
      "copyright": "© 2025 PocketBank. All rights reserved.",
      
      // Navigation
      "backToHome": "Back to Home",
      
      // Main Page
      "welcomeTitle": "Welcome to PocketBank",
      "welcomeSubtitle": "Your trusted digital banking solution",
      "signIn": "Sign In",
      "signUp": "Sign Up",
      "getStarted": "Get Started Today",
      "alreadyHaveAccount": "Already have an account?",
      "dontHaveAccount": "Don't have an account?",
      
      // Login Page
      "loginTitle": "Login to PocketBank",
      "email": "Email",
      "password": "Password",
      "emailRequired": "Please input your email!",
      "emailInvalid": "Please enter a valid email!",
      "passwordRequired": "Please input your password!",
      "loginSuccess": "Login successful!",
      
      // Register Page
      "registerTitle": "Create Your PocketBank Account",
      "firstName": "First Name",
      "lastName": "Last Name",
      "confirmPassword": "Confirm Password",
      "firstNameRequired": "Please input your first name!",
      "lastNameRequired": "Please input your last name!",
      "passwordsNoMatch": "The two passwords that you entered do not match!",
      "registerSuccess": "Registration successful! Please check your email to verify your account.",
      "createAccount": "Create Account",
      
      // Dashboard
      "dashboard": "Dashboard",
      "welcome": "Welcome",
      "accountBalance": "Account Balance",
      "loading": "Loading...",
      "editProfile": "Edit Profile",
      "logout": "Logout",
      
      // Edit Profile
      "editProfileTitle": "Edit Profile",
      "saveChanges": "Save Changes",
      "backToDashboard": "Back to Dashboard",
      
      // Email Verification
      "emailVerificationTitle": "Email Verification",
      "verificationSuccess": "Your email has been verified successfully!",
      "verificationError": "There was an error verifying your email.",
      "goToDashboard": "Go to Dashboard",
      "goToLogin": "Go to Login",
      
      // Common
      "cancel": "Cancel",
      "save": "Save",
      "delete": "Delete",
      "edit": "Edit",
      "close": "Close",
      "confirm": "Confirm",
      "error": "Error",
      "success": "Success",
      "warning": "Warning",
      "info": "Info"
    }
  },
  tr: {
    translation: {
      // App Header
      "pocketbank": "PocketBank",
      "copyright": "© 2025 PocketBank. Tüm hakları saklıdır.",
      
      // Navigation
      "backToHome": "Ana Sayfaya Dön",
      
      // Main Page
      "welcomeTitle": "PocketBank'a Hoş Geldiniz",
      "welcomeSubtitle": "Güvenilir dijital bankacılık çözümünüz",
      "signIn": "Giriş Yap",
      "signUp": "Kayıt Ol",
      "getStarted": "Bugün Başlayın",
      "alreadyHaveAccount": "Zaten hesabınız var mı?",
      "dontHaveAccount": "Hesabınız yok mu?",
      
      // Login Page
      "loginTitle": "PocketBank'a Giriş Yapın",
      "email": "E-posta",
      "password": "Şifre",
      "emailRequired": "Lütfen e-posta adresinizi girin!",
      "emailInvalid": "Lütfen geçerli bir e-posta adresi girin!",
      "passwordRequired": "Lütfen şifrenizi girin!",
      "loginSuccess": "Giriş başarılı!",
      
      // Register Page
      "registerTitle": "PocketBank Hesabınızı Oluşturun",
      "firstName": "Ad",
      "lastName": "Soyad",
      "confirmPassword": "Şifreyi Onayla",
      "firstNameRequired": "Lütfen adınızı girin!",
      "lastNameRequired": "Lütfen soyadınızı girin!",
      "passwordsNoMatch": "Girdiğiniz iki şifre eşleşmiyor!",
      "registerSuccess": "Kayıt başarılı! Hesabınızı doğrulamak için e-postanızı kontrol edin.",
      "createAccount": "Hesap Oluştur",
      
      // Dashboard
      "dashboard": "Kontrol Paneli",
      "welcome": "Hoş Geldiniz",
      "accountBalance": "Hesap Bakiyesi",
      "loading": "Yükleniyor...",
      "editProfile": "Profili Düzenle",
      "logout": "Çıkış Yap",
      
      // Edit Profile
      "editProfileTitle": "Profili Düzenle",
      "saveChanges": "Değişiklikleri Kaydet",
      "backToDashboard": "Kontrol Paneline Dön",
      
      // Email Verification
      "emailVerificationTitle": "E-posta Doğrulama",
      "verificationSuccess": "E-postanız başarıyla doğrulandı!",
      "verificationError": "E-postanızı doğrularken bir hata oluştu.",
      "goToDashboard": "Kontrol Paneline Git",
      "goToLogin": "Giriş Sayfasına Git",
      
      // Common
      "cancel": "İptal",
      "save": "Kaydet",
      "delete": "Sil",
      "edit": "Düzenle",
      "close": "Kapat",
      "confirm": "Onayla",
      "error": "Hata",
      "success": "Başarılı",
      "warning": "Uyarı",
      "info": "Bilgi"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language is English
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;