# LifeOS

**Calendar-first Social Life Engine** — A multi-user MVP superapp with Flow timeline, Network events, Vault bills, Routine habits, and System settings.

## Tech Stack

- **Mobile**: Expo + React Native + TypeScript + expo-router
- **API**: Node 20 LTS + NestJS + Supabase
- **Database**: Supabase Postgres + RLS

## Prerequisites

- **Node.js 20.19.0** (use nvm: `nvm use`)
- **pnpm 9+** (`npm install -g pnpm`)
- **Supabase** project (local or cloud)
- **Expo Go** app for mobile testing

## Quick Start

```bash
# 1. Node 20.19.4+ (Expo SDK 54 requires it)
nvm use    # or nvm install 20.19.4

# 2. Clean install (pnpm uses hoisted mode for Expo compatibility)
# Bash/Mac: rm -rf node_modules apps/*/node_modules pnpm-lock.yaml
# Windows: Remove-Item -Recurse -Force node_modules, apps\api\node_modules, apps\mobile\node_modules, pnpm-lock.yaml -ErrorAction SilentlyContinue

pnpm install

# 3. Env files
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
# Edit with Supabase credentials

# 4. Supabase migrations (SQL Editor or CLI)
# Run apps/api/supabase/migrations/*.sql in order

# 5. Start
pnpm dev:api     # Terminal 1: API on :3001
pnpm dev:mobile  # Terminal 2: Expo - MUST run from apps/mobile
```

**Mobile (critical):** Run `pnpm dev:mobile` from project root, or `cd apps/mobile && npx expo start --tunnel --clear`. Never run `npx expo start` from the root `life-os` folder.

**Mobile on physical device:** API must be reachable. Use cloudflared tunnel: `pnpm tunnel:api` (requires [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) installed). Copy the `https://xxx.trycloudflare.com` URL to `apps/mobile/.env` as `EXPO_PUBLIC_API_URL`, then restart Expo.

## Monorepo Structure

```
life-os/
├── apps/
│   ├── api/          # NestJS API
│   └── mobile/       # Expo React Native app
├── designs/          # UI reference PNGs (style only)
├── pnpm-workspace.yaml
└── .nvmrc
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + mobile in parallel |
| `pnpm dev:api` | Start API only |
| `pnpm dev:mobile` | Start mobile only |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript check all packages |
| `pnpm format` | Format code with Prettier |

## Environment Variables

### apps/api/.env

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Anon key (for JWT verification in auth guard)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (database operations)
- `PORT` — API port (default: 3001)
- `OPENAI_API_KEY` — Optional; AI features are feature-flagged

### apps/mobile/.env

- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Anon key for client auth
- `EXPO_PUBLIC_API_URL` — API base URL (use `http://10.0.2.2:3001` for Android emulator)

## Design Principles

- **Design tokens** — No hardcoded hex colors
- **i18n-ready** — EN + TR skeleton
- **Multi-user** — Auth, invites, RSVP, chat from day 1
- **Non-blocking** — Long AI tasks use async jobs

## Mobile Assets

Expo needs `icon.png`, `splash.png`, and `adaptive-icon.png` in `apps/mobile/assets/`.
Placeholder assets exist; replace with your own.

## Mobile Troubleshooting

| Error | Fix |
|-------|-----|
| `../../App` not found | Run Expo from `apps/mobile`, not root |
| `PlatformConstants` / `getDevServer` | Ensure Node 20.19.4+, run `pnpm install` after `.npmrc` has `node-linker=hoisted` |
| `@expo/metro-runtime/symbolicate` | Clean install: delete `node_modules` + `pnpm-lock.yaml`, run `pnpm install` |
| Expo Go "SDK incompatible" | Project uses SDK 54; ensure Expo Go app is up to date |
| **Request timed out** (exp.direct, loading takılıyor) | Aşağıdaki "Telefonda Request Timeout" bölümüne bak. |
| **ENOENT** (inquirer_tmp, watch) | Metro config güncellendi. Hâlâ alırsan: `pnpm install` tekrar çalıştır. Projeyi OneDrive dışına taşımak da yardımcı olabilir. |

### Telefonda Request Timeout (Opening project'te Kalıyor)

Expo tunnel ve Cloudflared denedikten sonra hâlâ "Opening project" / "request timed out" alıyorsan:

1. **iPhone Kişisel Hotspot (en güvenilir – tunnel gerekmez):**
   - iPhone'da: Ayarlar → Kişisel Hotspot → Aç
   - PC'yi bu hotspot'a WiFi ile bağla (şifreyi iPhone'dan al)
   - `cd apps/mobile` → `npx expo start --clear`
   - QR kodu okut veya Expo Go'da manuel `exp://172.20.10.2:8081` dene (PC'nin IP'si genelde 172.20.10.2)
   - iPhone kendi hotspot'una bağlı cihazlara erişebilir

2. **Android + USB kablo varsa:**
   ```powershell
   cd apps/mobile
   pnpm dev:android:usb
   ```
   Telefonu USB ile bağla, USB debugging açık olmalı. Expo Go'dan projeyi aç (QR veya "Enter URL manually" → `exp://127.0.0.1:8081`).

3. **Aynı WiFi (LAN):**
   - PC ve telefon aynı WiFi'de olmalı.
   ```powershell
   pnpm dev:lan
   ```
   QR okut. Olmazsa: Windows Firewall’da Node/Metro (port 8081) için izin ver.

3. **PC’den Hotspot:**
   - Windows’ta "Mobil hotspot" aç (Ayarlar → Ağ → Mobil hotspot).
   - Telefonu bu hotspot’a bağla.
   - PC de aynı hotspot’a bağlı olsun veya Ethernet kullanıyor olsun.
   - `pnpm dev:lan` çalıştır.

5. **Cloudflared tunnel (dene):**
   ```powershell
   pnpm dev:mobile:tunnel
   ```
   Expo’nun ngrok tunnel’ı bazen timeout veriyor. `.expo` silip tekrar dene: `Remove-Item -Recurse -Force apps/mobile/.expo`.

## App Shortcuts (Open App)

Events and Habits support an "Open App" shortcut that opens a linked app (e.g. Apple Fitness, Passolig, Ziraat). The shortcut is stored in `app_shortcuts` and linked via `timeline_items.shortcut_id` (events) or `habits.app_shortcut_id` (habits).

- **Migration**: Run `apps/api/supabase/migrations/20250215000001_app_shortcuts.sql` before using shortcuts
- **API**: `POST/GET/PATCH/DELETE /shortcuts`; events/habits updated via `shortcutId` / `appShortcutId` in PATCH body
- **Mobile**: Uses curated suggestions (Fitness/Banking/Tickets) + custom URL scheme input. `Linking.canOpenURL` + `openURL`; on failure shows "Copy link" and "Open Store" (optional `store_url`). iOS requires `LSApplicationQueriesSchemes` in app.json for custom schemes

## Architecture Notes

- Timeline items are the core stream; events, bills, habits extend timeline_items
- RLS enforces user isolation + shared event access
- All user-facing strings go through i18next
- Zustand for UI state, React Query for server state
