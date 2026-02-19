# LifeOS MVP Implementation Plan

Detaylı görev listesi, öncelik sırası ve teknik notlar. Rapor tarihi: 2025-02-14.

---

## PHASE 1: Quick Wins (1–2 hafta)

AI deneyimi, performans ve ekran kalitesi için acil iyileştirmeler.

### 1.1 AI / Copilot İyileştirmeleri

| # | Görev | Detay | Dosya |
|---|-------|-------|-------|
| 1 | Parse loading state | ✅ "AI analiz ediyor..." badge + "Birkaç saniye sürebilir" | `voice.tsx` |
| 2 | Parse timeout artır | ✅ API_TIMEOUT_AI=20s, API_TIMEOUT_DEFAULT=12s | `lib/api.ts` |
| 3 | AI model optimizasyonu | ✅ OPENAI_MODEL in .env.example, gpt-4o-mini default | `ai.service.ts`, `.env.example` |
| 4 | Parse prompt sadeleştir | ✅ Optimized ~60→25 lines, fewer tokens | `ai/prompts/parse-command.txt` |
| 5 | Streaming (opsiyonel) | OpenAI `stream: true` ile parça parça yanıt; UX daha iyi | `ai.service.ts` |
| 6 | Voice modal layout | Input + mic + parsed cards daha net; mobilde overflow düzelt | `voice.tsx` |
| 7 | Parse hatası mesajı | ✅ Timeout için özel mesaj | `voice.tsx` |
| 8 | Copilot ekran: Apply/Cancel | ✅ ConfirmModal: Plan/Reschedule/Summarize için onay | `copilot.tsx` |

### 1.2 Performans / Servis İyileştirmeleri

| # | Görev | Detay | Dosya |
|---|-------|-------|-------|
| 9 | API timeout ayrıştır | ✅ parse: 20s, diğer: 12s | `lib/api.ts` |
| 10 | React Query staleTime | Timeline 60_000; diğer ekranlarda 30_000–60_000 | `flow.tsx`, `vault.tsx`, vb. |
| 11 | API health cache | Bağlantı testi sonucu 30s cache | `lib/api.ts` veya store |
| 12 | Görsel lazy loading | FlashList zaten var; büyük listelerde kullan | `events.tsx`, `vault.tsx` |
| 13 | Backend: AI cache | Aynı komut tekrar gönderilirse cache’den dön (opsiyonel) | `ai.service.ts` |

### 1.3 Ekran / UI İyileştirmeleri

| # | Görev | Detay | Dosya |
|---|-------|-------|-------|
| 14 | ErrorState component | ✅ flow, vault, events, insights'ta kullanılıyor | `components/ui/ErrorState.tsx` |
| 15 | LoadingState iyileştir | Skeleton veya daha anlamlı spinner | `LoadingState.tsx` |
| 16 | Copilot ekran düzeni | Chat alanı, quick actions, input daha okunaklı | `copilot.tsx` |
| 17 | Voice modal: mobil UX | Alt panel sabit; klavye açıkken scroll | `voice.tsx` |
| 18 | Inbox boş ekran | Daha açıklayıcı empty state | `inbox.tsx` |
| 19 | Flow: empty timeline | "Bugün plan yok" mesajı iyileştir | `flow.tsx` |

### 1.4 Teknoloji / Altyapı

| # | Görev | Detay | Dosya |
|---|-------|-------|-------|
| 20 | OPENAI_MODEL env | `.env.example` ve dökümantasyon | `apps/api/.env.example` |
| 21 | AbortController kullanımı | Tab değişince parse iptal et | `voice.tsx` |

---

## PHASE 2: Core MVP (2–3 hafta)

Navigation, Inbox ve Apply/Cancel gibi temel MVP parçaları.

### 2.1 Navigation

| # | Görev | Detay | Dosya |
|---|-------|-------|-------|
| 22 | Tab sırası: Home, Inbox, +, Insights, Settings | MVP’ye uygun tab bar | `CustomTabBar.tsx`, `_layout.tsx` |
| 23 | Routine (Tasks) → menü | Flow menüsüne Tasks ekle | `HomeMenuModal.tsx` |
| 24 | Daily Brief → Copilot link | ✅ "Chat with Nomi" butonu | `DailyBriefCard.tsx` |

### 2.2 Unified Inbox

| # | Görev | Detay | Dosya |
|---|-------|-------|-------|
| 25 | InboxItem interface | `id, type, content, createdAt, source` | `types/inbox.ts` |
| 26 | Inbox AsyncStorage | `nomi_inbox_items` key | `lib/inbox-storage.ts` |
| 27 | Inbox Zustand store | items, add, remove, archive | `store/inbox.ts` |
| 28 | Voice → Inbox fallback | Parse edilemezse veya "inbox'a at" → Inbox | `voice.tsx` |
| 29 | Convert to Task | Inbox item → event-create / task form | `inbox.tsx` |
| 30 | Convert to Event/Habit/Bill | Her biri için ayrı flow | `inbox.tsx` |
| 31 | Archive / Delete | Soft delete veya archive flag | `inbox.tsx` |
| 32 | Undo (basit) | Son convert için 5s undo | `inbox.tsx` |

### 2.3 AI Apply/Cancel

| # | Görev | Detay | Dosya |
|---|-------|-------|-------|
| 33 | Confirm modal component | Apply / Cancel butonları | `components/ui/ConfirmModal.tsx` |
| 34 | Plan my day → confirm | "Günü planlamak ister misin?" | `copilot.tsx`, `DailyBriefCard` |
| 35 | Reschedule → confirm | "Etkinlikler yeniden planlansın mı?" | `copilot.tsx` |
| 36 | Summarize → confirm | "Özet oluşturulsun mu?" | `copilot.tsx` |

### 2.4 AI Chat (Temel)

| # | Görev | Detay | Dosya |
|---|-------|-------|-------|
| 37 | Chat mesaj listesi | `{ role, content }[]` state | `copilot.tsx` |
| 38 | Send handler | Input + Enter / Send; mesaj ekle | `copilot.tsx` |
| 39 | Mock assistant yanıtı | "Plan my day için hazırım" vb. placeholder | `copilot.tsx` |
| 40 | Voice trigger UI | Mic butonu Copilot’ta | `copilot.tsx` |

---

## PHASE 3: Polish & Full MVP (2 hafta)

Task model, Insights, Settings ve son dokunuşlar.

### 3.1 Task Model

| # | Görev | Detay | Dosya |
|---|-------|-------|-------|
| 41 | Task metadata | priority, duration, energy, life area | API + `event` metadata |
| 42 | Task detail sayfası | Edit, subtasks (basit) | `task/[id].tsx` veya `event/[id]` |
| 43 | Filter/Sort | Routine’da priority, date | `routine.tsx` |

### 3.2 Insights

| # | Görev | Detay | Dosya |
|---|-------|-------|-------|
| 44 | Weekly / Monthly toggle | Period selector | `insights.tsx` |
| 45 | Life areas summary | Event count per area | `insights.tsx`, API |
| 46 | Insufficient data state | "Yeterli veri yok" | `insights.tsx` |
| 47 | AI suggestions (mock) | Placeholder kart | `insights.tsx` |

### 3.3 Settings

| # | Görev | Detay | Dosya |
|---|-------|-------|-------|
| 48 | Export data | Tüm verileri JSON, Share API | `system.tsx` |
| 49 | Delete local data | AsyncStorage temizle + sign out | `system.tsx` |
| 50 | Privacy screen | İzin açıklamaları | `app/(modal)/privacy.tsx` veya `system.tsx` içinde |

### 3.4 Calendar

| # | Görev | Detay | Dosya |
|---|-------|-------|-------|
| 51 | Conflict indicator | Overlap tespiti + uyarı | `events.tsx`, `EventCard` |

---

## AI-SPECIFIC DETAYLAR

### Parse Command Akışı

```
User Input (text/voice)
    → api.post('/ai/parse-command', { text })
    → AI: parse-command.txt prompt + gpt-4o-mini
    → ParsedAction { action, data }
    → Voice: ParsedCard göster, Confirm/Edit
    → create_event / create_habit / create_bill mutation
```

### Yavaşlık Nedenleri

1. **OpenAI API latency**: 3–10 saniye (model + ağ)
2. **Mobile → API**: Tunnel veya LAN; gecikme eklenir
3. **Prompt boyutu**: Daha kısa prompt = daha hızlı
4. **Model**: `gpt-4o-mini` ≈ 2–5s, `gpt-4o` ≈ 5–15s

### Önerilen AI İyileştirmeleri

| İyileştirme | Etki | Zorluk |
|-------------|------|--------|
| gpt-4o-mini kullan | Hız ++ | Kolay |
| Timeout 20s | Timeout hatası azalır | Kolay |
| Loading skeleton | UX ++ | Kolay |
| Parse cache (aynı text) | Tekrar istekte hız ++ | Orta |
| Streaming | İlk token hızlı görünür | Orta |

---

## PERFORMANS CHEAT SHEET

| Bölge | Şu an | Öneri |
|-------|-------|-------|
| API timeout | 8s | parse: 20s, diğer: 12s |
| Timeline staleTime | 60_000 | Aynı |
| React Query retry | 2 | Kritik: 2, diğer: 1 |
| Health check cache | Yok | 30s memory cache |
| Voice parse retry | - | Kullanıcı "Tekrar dene" ile |

---

## EKRAN KALİTESİ ÖZETİ

| Ekran | Sorun | Çözüm |
|-------|-------|-------|
| Voice | Parse sırasında belirsiz bekleme | Skeleton + "Parsing…" |
| Copilot | Placeholder chat | Basit mesaj listesi + mock yanıt |
| Inbox | Boş, convert çalışmıyor | Inbox storage + convert flow |
| Flow | - | Genel iyi |
| Insights | Tek period | Weekly/Monthly toggle |
| System | Export/Delete yok | İki buton + Privacy |
| Routine | Filter yok | Filter/sort |

---

## GÖREV ÖNCELİĞİ (Sıralı)

**Hemen (Bu hafta):**
1. Parse loading/skeleton
2. API timeout parse için 20s
3. ErrorState component
4. Copilot Apply/Cancel (Plan, Reschedule, Summarize)
5. Voice modal UX (mobil scroll, layout)

**Sonraki hafta:**
6. Tab: Home, Inbox, +, Insights, Settings
7. Inbox: model + AsyncStorage + convert aksiyonları
8. Copilot: Chat UI (mesaj listesi + send)
9. Daily Brief → Copilot link

**2–3 hafta sonra:**
10. Settings: Export + Delete
11. Insights: Toggle + insufficient data
12. Task metadata + detail
13. Conflict indicator

---

## TEKNOLOJİ İYİLEŞTİRMELERİ

| Paket | Amaç | Zorunlu? |
|-------|------|----------|
| @gorhom/bottom-sheet | Convert modal, confirm | Hayır (Modal yeterli) |
| react-native-toast-message | Undo bildirimi | Hayır |
| react-native-reanimated | Bottom sheet için | Hayır |

Mevcut stack (Expo, Zustand, React Query) yeterli. Ek paketler ihtiyaca göre eklenebilir.

---

*Plan güncellemesi: implement sırasında bu dosya revize edilebilir.*
