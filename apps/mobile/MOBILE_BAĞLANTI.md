# Mobil – API Bağlantısı

Telefon/emülatör API'ye **aynı WiFi** veya **cloudflared tunnel** ile bağlanır.

## Önerilen: Cloudflared Tunnel

Farklı ağlarda bile çalışır. Aynı WiFi sorunları (firewall, NAT) yok.

### 1. Cloudflared kurulumu (bir kez)

**Windows (winget):**
```bash
winget install cloudflare.cloudflared
```

**Manuel:** [Cloudflare Downloads](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) → `cloudflared-windows-amd64.exe` indir, PATH'e ekle.

### 2. Başlatma – 3 terminal gerekli

**Terminal 1** – API:
```bash
pnpm dev:api
```

**Terminal 2** – API tunnel:
```bash
pnpm tunnel:api
```
→ Çıkan `https://xxx.trycloudflare.com` URL'yi kopyala.

**Terminal 3** – Metro tunnel:
```bash
pnpm tunnel:metro
```
→ Çıkan `https://yyy.trycloudflare.com` URL'yi kopyala (API'den farklı olacak).

### 3. .env güncelle

`apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://xxx.trycloudflare.com
EXPO_PACKAGER_PROXY_URL=https://yyy.trycloudflare.com
```
(Her tunnel'dan çıkan URL'yi sırayla yaz)

### 4. Expo başlat (4. terminal)

```bash
cd apps/mobile
npx expo start --clear
```

**ÖNEMLİ:** `--tunnel` **KULLANMA**. EXPO_PACKAGER_PROXY_URL kullanırken Expo'nun kendi tunnel'ı çakışır. Sadece `expo start --clear`.

### 5. Test

Uygulama → System → **Bağlantıyı test et** → ✓ görürsen hazır.

---

## Alternatif: Aynı WiFi

1. Telefon ve bilgisayar **aynı WiFi**de olmalı.
2. Bilgisayar IP: `ipconfig` (Windows) veya `ifconfig` (Mac/Linux)
3. `apps/mobile/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://BILGISAYAR_IP:3002
   ```
   Örn: `http://192.168.1.5:3002`
4. `pnpm dev:api` çalışıyor olsun.
5. Expo yeniden başlat.

## Sorun giderme

- **"Zaman aşımı" / "API'ye ulaşılamıyor"**  
  → cloudflared kullan: `pnpm tunnel:api` → URL'yi .env'e yaz → Expo yeniden başlat

- **Tunnel her seferinde yeni URL veriyor**  
  → Evet. Her tunnel başlatışında yeni URL gelir. `EXPO_PUBLIC_API_URL` ve `EXPO_PACKAGER_PROXY_URL`'i güncelle, Expo'yu yeniden başlat.

- **"Opening project" takılıyor**  
  → `EXPO_PACKAGER_PROXY_URL` dolu olmalı. `pnpm tunnel:metro` çalıştır, URL'yi .env'e yaz.

- **cloudflared komutu bulunamıyor**  
  → `winget install cloudflare.cloudflared` veya yukarıdaki manuel kurulum.
