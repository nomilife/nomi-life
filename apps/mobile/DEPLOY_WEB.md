# Nomi Mobile – Web Deploy

Mobil uygulamayı web’e deploy ederek bir URL üzerinden paylaşabilir, telefondan "Ana ekrana ekle" ile PWA gibi kullanabilirsin.

## Gereksinimler

- API Railway’de deploy edilmiş olmalı
- `EXPO_PUBLIC_API_URL` Railway URL’ine ayarlı olmalı (build sırasında)

## Deploy platformları

| Platform | Ücretsiz tier | Özellik |
|----------|---------------|---------|
| **Vercel** | Var | Hızlı, otomatik URL, PWA uyumlu |
| **Netlify** | Var | Benzer Vercel’e, kolay deploy |
| **Cloudflare Pages** | Var | Hızlı CDN, ücretsiz |
| **GitHub Pages** | Var | Repo ile entegre |
| **Expo EAS Hosting** | Kısıtlı ücretsiz | Expo’ya özel, en uyumlu |

**Pratik seçenek:** Vercel (en yaygın).

---

## Vercel ile deploy

### 1. Ön hazırlık

`.env` içinde Railway API URL’in olmalı (zaten var):

```
EXPO_PUBLIC_API_URL=https://api-production-xxx.up.railway.app
```

### 2. Vercel’e bağla

1. [vercel.com](https://vercel.com) → GitHub ile giriş
2. "Add New Project" → LifeOS repo’sunu seç
3. **Root Directory:** `apps/mobile`
4. **Framework Preset:** Other
5. **Build Command:** `npx expo export -p web`
6. **Output Directory:** `dist`
7. **Environment Variables:**
   - `EXPO_PUBLIC_API_URL` = Railway API URL
   - `EXPO_PUBLIC_SUPABASE_URL` = Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key
8. Deploy’a tıkla

### 3. Sonuç

Örnek URL: `nomi-xxx.vercel.app`

- Tarayıcıdan açılır
- Telefonda "Add to Home Screen" ile ana ekrana eklenebilir
- Arkadaşların bu link ile test edebilir

---

## Netlify ile deploy

1. [netlify.com](https://netlify.com) → GitHub bağla
2. "Add new site" → "Import existing project"
3. Base directory: `apps/mobile`
4. Build command: `npx expo export -p web`
5. Publish directory: `dist`
6. Ortam değişkenlerini ekle (Vercel’deki gibi)
7. Deploy

---

## Local’de build denemek

```bash
cd apps/mobile
npx expo export -p web
```

`dist/` klasörü oluşur. Lokal test için:

```bash
npx serve dist
```
