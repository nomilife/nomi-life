# Supabase Auth Ayarları

## Telefonda "Email not confirmed" hatası

Supabase varsayılan olarak e-posta doğrulaması ister. İki seçenek:

### 1. E-postadaki linke tıklayın
Kayıt sonrası gelen e-postadaki "Confirm your email" linkine tıklayın.

### 2. Geliştirme için doğrulamayı kapatın
1. [Supabase Dashboard](https://supabase.com/dashboard) → projeniz
2. **Authentication** → **Providers** → **Email**
3. **"Confirm email"** seçeneğini KAPAT
4. Kaydet

Bu şekilde yeni hesaplar hemen giriş yapabilir (sadece development için önerilir).
