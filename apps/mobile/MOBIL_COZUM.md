# Mobil Test Çözümü (Router izolasyonu varsa)

Telefon 192.168.1.2'ye ulaşamıyorsa (timeout) router'da cihaz izolasyonu vardır. **Her ikisi için de tunnel şart.**

## Adım adım

### 1. Cloudflare Tunnel kur (tek seferlik, 2 dk)

**Windows:**
- https://github.com/cloudflare/cloudflared/releases adresine git
- `cloudflared-windows-amd64.exe` indir
- `cloudflared.exe` olarak yeniden adlandır, PATH'e ekle veya proje klasörüne koy

Veya PowerShell (yönetici):
```powershell
winget install cloudflare.cloudflared
```

### 2. 3 terminal aç

**Terminal 1 – API:**
```bash
pnpm dev:api
```

**Terminal 2 – API tunnel (Cloudflare):**
```bash
pnpm tunnel:api:cf
```
(Projede cloudflared paketi kurulu - global kurulum gerekmez)
Çıktıda şuna benzer satır görünecek:
```
https://xxxx-xx-xx-xx-xx.trycloudflare.com
```
Bu URL'yi kopyala.

**Terminal 3 – Expo (tunnel ile):**
```bash
cd apps/mobile
npx expo start --tunnel
```

### 3. .env güncelle

`apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://xxxx-xx-xx-xx-xx.trycloudflare.com
```
(Kopyaladığın URL'yi yapıştır)

### 4. Expo'yu yeniden başlat

`.env` değişince Expo'yu durdurup (Ctrl+C) tekrar başlat:
```bash
npx expo start --tunnel
```

### 5. QR ile test et

Uygulamayı aç → System → "Bağlantıyı test et" → Yeşil ✓ görürsen API çalışıyordur.

---

**Not:** Cloudflare her seferinde yeni URL verir. Tunnel'ı her yeniden başlattığında .env'i güncelleyip Expo'yu yeniden başlatman gerekir.
