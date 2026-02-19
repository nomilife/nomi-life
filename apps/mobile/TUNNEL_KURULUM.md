# Cloudflared ile API Tunnel

Mobil uygulamanın bilgisayarındaki API'ye (localhost:3002) internet üzerinden ulaşması için Cloudflare Quick Tunnel kullanılır.

## Hızlı başlangıç

1. **Cloudflared kur** (bir kez):  
   `winget install cloudflare.cloudflared`

2. **Terminal 1:** `pnpm dev:api`

3. **Terminal 2:** `pnpm tunnel:api`

4. Çıkan `https://xxx.trycloudflare.com` URL'sini `apps/mobile/.env` içinde `EXPO_PUBLIC_API_URL` olarak yaz.

5. Expo'yu yeniden başlat: `npx expo start --tunnel --clear`

6. Telefonda System → Bağlantıyı test et → ✓

## Neden Cloudflared?

- **Localtunnel** bazen zaman aşımı, bağlantı kopması
- **Cloudflared** daha stabil, hızlı, aynı WiFi gerekmez
- Ücretsiz Quick Tunnel, hesap gerekmez

## Notlar

- Her `pnpm tunnel:api` başlatışında yeni URL alırsın → .env güncelle
- API (Terminal 1) çalışırken tunnel (Terminal 2) açık olmalı
- Proje kökünden çalıştır: `pnpm tunnel:api` (apps/mobile'dan değil)
