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
      "existingCustomer": "Existing Customer",
      "existingCustomerDescription": "Access your account and manage your finances securely.",
      "newCustomer": "New Customer",
      "newCustomerDescription": "Join thousands who trust PocketBank for their banking needs.",
      "welcomeBack": "Welcome Back!",
      "dashboardDescription": "Access your dashboard to manage your finances and view your account details.",
      "goToDashboard": "Go to Dashboard",
      
      // Login Page
      "loginTitle": "Login to PocketBank",
      "email": "Email",
      "password": "Password",
      "emailRequired": "Please input your email!",
      "emailInvalid": "Please enter a valid email!",
      "passwordRequired": "Please input your password!",
      "loginSuccess": "Login successful!",
      "mfaTitle": "Multi-Factor Authentication",
      "mfaDescription": "Enter the 6-digit code from your authenticator app",
      "mfaPlaceholder": "Enter 6-digit code",
      "verifyCode": "Verify Code",
      "backToLogin": "Back to Login",
      "mfaRequired": "Please enter your 6-digit MFA code",
      "mfaInvalid": "Please enter a valid 6-digit code",
      "forgotPassword": "Forgot your password?",
      
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
      "goToLogin": "Go to Login",
      
      // Forgot Password
      "forgotPasswordTitle": "Forgot Password",
      "forgotPasswordSubtitle": "Enter your email address and we'll send you a link to reset your password.",
      "sendResetEmail": "Send Reset Email",
      "resetEmailSent": "Password reset email sent! Check your inbox.",
      "checkYourEmail": "Check Your Email",
      "resetEmailDescription": "We've sent a password reset link to your email address. Click the link in the email to reset your password.",
      "didntReceiveEmail": "Didn't receive the email? Check your spam folder or try again.",
      "sendAnotherEmail": "Send Another Email",
      "rememberPassword": "Remember your password?",
      "backToSignIn": "Back to Sign In",
      "resetEmailFailed": "Failed to send reset email",
      "enterEmailAddress": "Enter your email address",
      
      // Reset Password
      "resetPasswordTitle": "Reset Your Password",
      "resetPasswordSubtitle": "Enter your new password below.",
      "newPassword": "New password",
      "confirmNewPassword": "Confirm new password",
      "updatePassword": "Update Password",
      "passwordUpdated": "Password Updated!",
      "passwordUpdateSuccess": "Your password has been successfully updated. You will be redirected to your dashboard shortly.",
      "passwordsDoNotMatch": "Passwords do not match!",
      "passwordTooShort": "Password must be at least 6 characters long!",
      "passwordUpdateFailed": "Failed to update password",
      "invalidResetLink": "Invalid or expired reset link. Please request a new one.",
      "verifyingResetLink": "Verifying reset link...",
      "pleaseInputNewPassword": "Please input your new password!",
      "pleaseConfirmNewPassword": "Please confirm your new password!",
      "passwordMinLength": "Password must be at least 6 characters long!",
      
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
      "existingCustomer": "Mevcut Müşteri",
      "existingCustomerDescription": "Hesabınıza erişin ve finanslarınızı güvenle yönetin.",
      "newCustomer": "Yeni Müşteri",
      "newCustomerDescription": "Bankacılık ihtiyaçları için PocketBank'a güvenen binlerce kişiye katılın.",
      "welcomeBack": "Tekrar Hoş Geldiniz!",
      "dashboardDescription": "Finanslarınızı yönetmek ve hesap ayrıntılarınızı görüntülemek için kontrol panelinize erişin.",
      "goToDashboard": "Kontrol Paneline Git",
      
      // Login Page
      "loginTitle": "PocketBank'a Giriş Yapın",
      "email": "E-posta",
      "password": "Şifre",
      "emailRequired": "Lütfen e-posta adresinizi girin!",
      "emailInvalid": "Lütfen geçerli bir e-posta adresi girin!",
      "passwordRequired": "Lütfen şifrenizi girin!",
      "loginSuccess": "Giriş başarılı!",
      "mfaTitle": "Çok Faktörlü Kimlik Doğrulama",
      "mfaDescription": "Kimlik doğrulama uygulamanızdan 6 haneli kodu girin",
      "mfaPlaceholder": "6 haneli kodu girin",
      "verifyCode": "Kodu Doğrula",
      "backToLogin": "Girişe Dön",
      "mfaRequired": "Lütfen 6 haneli MFA kodunuzu girin",
      "mfaInvalid": "Lütfen geçerli bir 6 haneli kod girin",
      "forgotPassword": "Şifrenizi unuttunuz mu?",
      
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
      "goToLogin": "Giriş Sayfasına Git",
      
      // Forgot Password
      "forgotPasswordTitle": "Şifremi Unuttum",
      "forgotPasswordSubtitle": "E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.",
      "sendResetEmail": "Sıfırlama E-postası Gönder",
      "resetEmailSent": "Şifre sıfırlama e-postası gönderildi! Gelen kutunuzu kontrol edin.",
      "checkYourEmail": "E-postanızı Kontrol Edin",
      "resetEmailDescription": "E-posta adresinize şifre sıfırlama bağlantısı gönderdik. Şifrenizi sıfırlamak için e-postadaki bağlantıya tıklayın.",
      "didntReceiveEmail": "E-posta almadınız mı? Spam klasörünüzü kontrol edin veya tekrar deneyin.",
      "sendAnotherEmail": "Başka E-posta Gönder",
      "rememberPassword": "Şifrenizi hatırladınız mı?",
      "backToSignIn": "Giriş Sayfasına Dön",
      "resetEmailFailed": "Sıfırlama e-postası gönderilemedi",
      "enterEmailAddress": "E-posta adresinizi girin",
      
      // Reset Password
      "resetPasswordTitle": "Şifrenizi Sıfırlayın",
      "resetPasswordSubtitle": "Aşağıya yeni şifrenizi girin.",
      "newPassword": "Yeni şifre",
      "confirmNewPassword": "Yeni şifreyi onayla",
      "updatePassword": "Şifreyi Güncelle",
      "passwordUpdated": "Şifre Güncellendi!",
      "passwordUpdateSuccess": "Şifreniz başarıyla güncellendi. Kısa süre içinde kontrol panelinize yönlendirileceksiniz.",
      "passwordsDoNotMatch": "Şifreler eşleşmiyor!",
      "passwordTooShort": "Şifre en az 6 karakter uzunluğunda olmalıdır!",
      "passwordUpdateFailed": "Şifre güncellenemedi",
      "invalidResetLink": "Geçersiz veya süresi dolmuş sıfırlama bağlantısı. Lütfen yeni bir tane isteyin.",
      "verifyingResetLink": "Sıfırlama bağlantısı doğrulanıyor...",
      "pleaseInputNewPassword": "Lütfen yeni şifrenizi girin!",
      "pleaseConfirmNewPassword": "Lütfen yeni şifrenizi onaylayın!",
      "passwordMinLength": "Şifre en az 6 karakter uzunluğunda olmalıdır!",
      
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