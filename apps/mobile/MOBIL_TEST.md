# Mobilde çalışması için (kritik adımlar)

## Seçenek A: Tunnel OLMADAN (önerilen - aynı WiFi)

1. **Telefon ve bilgisayar AYNI WiFi'de olmalı** (telefon mobil veri KAPALI)

2. Terminalde:
   ```bash
   npx expo start
   ```
   **ÖNEMLİ:** `--tunnel` YAZMAYIN. Sadece `npx expo start`

3. QR kodu telefonla tarayın (Expo Go açık olsun)

4. Uygulama açılacak. API `http://192.168.1.2:3002` adresine gidecek (aynı ağ)

## Seçenek B: Tunnel ile (farklı ağda test)

`--tunnel` kullanıyorsanız telefon farklı ağda olabilir. Bu durumda 192.168.1.2 ERİŞİLEMEZ.

**API için de tunnel gerekir:**

1. Terminal 1: `pnpm dev:api`
2. Terminal 2: `pnpm tunnel:api` → çıkan URL'yi kopyala (örn. https://xxx.loca.lt)
3. `apps/mobile/.env` → `EXPO_PUBLIC_API_URL=https://xxx.loca.lt` (kopyaladığınız)
4. Expo'yu DURDUR (Ctrl+C), yeniden başlat: `npx expo start --tunnel`
5. QR tara

**UYARI:** Her tunnel açışında URL değişir. .env güncelleyip Expo yeniden başlatmanız gerekir.

## Özet

- `expo start` (tunnel yok) + aynı WiFi = En stabil
- `expo start --tunnel` = API için de tunnel şart
