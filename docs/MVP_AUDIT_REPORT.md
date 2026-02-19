# LifeOS MVP Audit Report

Bu rapor, MVP özellik listesine göre projenin mevcut durumunu, eksikleri ve önerilen iyileştirmeleri özetler.

---

## ÖZET TABLO

| Alan | Tamamlanma | Durum | Kritik Eksikler |
|------|------------|-------|-----------------|
| A) Navigation & IA | %60 | Kısmi | Inbox tab’da değil, Copilot erişimi farklı |
| B) Unified Inbox | %15 | Eksik | Model/API yok, convert aksiyonları yok |
| C) AI Copilot | %45 | Kısmi | Chat UI placeholder, Apply/Cancel yok |
| D) Advanced Task | %25 | Eksik | Task modeli zayıf, detay ekranı yok |
| E) Calendar Views | %70 | Kısmen | Haftalık/aylık var, conflict indicator yok |
| F) Insights | %55 | Kısmi | Haftalık/aylık toggle yok, life areas eksik |
| G) Settings | %70 | Kısmen | Export, Delete account, Privacy ekranı yok |
| Engineering | %75 | İyi | ErrorState, BottomSheet, accessibility eksik |

**Genel MVP Tamamlanma: ~%50**

---

## A) NAVIGATION & INFORMATION ARCHITECTURE

### MVP Gereksinim
- Bottom tabs: **Home, Inbox, + (modal), Insights, Settings**
- Dedicated Inbox screen
- AI Copilot chat: Home (Daily Brief) + Inbox’tan erişilebilir

### Mevcut Durum
| Özellik | Var mı? | Detay |
|---------|---------|-------|
| Bottom tabs | ✅ Kısmen | `flow`, `copilot`, `routine`, `system` (4 tab + FAB) |
| Inbox tab | ❌ | Inbox menüde, tab bar’da yok |
| Home | ✅ | `flow` = Today's Flow |
| + Modal | ✅ | FAB → AddActionModal |
| Insights tab | ❌ | Menüden erişiliyor |
| Settings tab | ✅ | `system` |
| Copilot erişimi | ⚠️ | Sadece Copilot tab; Daily Brief’ten link yok |

### Yapılacaklar
1. Tab sırasını değiştir: **Home, Inbox, +, Insights, Settings**
2. `routine` (Tasks) → menüye taşı veya Tasks ayrı tab olsun (MVP’de task var)
3. Daily Brief card’a “Chat with Nomi” / Copilot linki ekle
4. Inbox’tan Copilot’a geçiş (ör. “Convert with AI”)

---

## B) UNIFIED INBOX

### MVP Gereksinim
- InboxItem modeli ve local-first storage
- Quick capture (note/voice) → Inbox
- Aksiyonlar: Convert to Task, Event, Habit, Bill | Archive/Delete
- Undo for conversions

### Mevcut Durum
| Özellik | Var mı? | Detay |
|---------|---------|-------|
| Inbox screen | ✅ | `inbox.tsx` – UI var |
| InboxItem model | ❌ | `items: [] // TODO: API` – hardcoded boş |
| Storage (AsyncStorage) | ❌ | Hiç persistence yok |
| Quick capture → Inbox | ⚠️ | Voice modal `ai/parse-command` ile direkt event/habit/bill oluşturuyor; Inbox’a düşmüyor |
| Convert to Task | ❌ | UI’da Task/Event butonları var ama çalışmıyor |
| Convert to Event/Habit/Bill | ❌ | Aynı |
| Archive/Delete | ❌ | Yok |
| Undo | ❌ | Yok |
| Supabase/API | ❌ | `inbox` tablosu yok |

### Yapılacaklar
1. **InboxItem interface**: `id, type, content, createdAt, source (voice|manual)` vb.
2. **AsyncStorage** ile local-first: `nomi_inbox_items` key
3. Voice/Quick capture: Parse edilemeyen veya “inbox’a at” seçeneği ile Inbox’a kaydet
4. Convert aksiyonları: Task/Event/Habit/Bill create formlarına yönlendir + `content` pre-fill
5. Archive/Delete + Undo (örn. `react-native-toast-message` veya basit state)

---

## C) AI COPILOT

### MVP Gereksinim
- Daily Brief card (Home üstü)
- AI Chat screen: mesaj listesi, input, voice trigger
- Suggested Actions: Plan my day, Reschedule, Summarize, Convert Inbox item
- **Apply / Cancel onayı** zorunlu

### Mevcut Durum
| Özellik | Var mı? | Detay |
|---------|---------|-------|
| Daily Brief card | ✅ | Flow’da SwipeableBriefCard, Plan/Reschedule/Summarize/Add task |
| AI Chat screen | ⚠️ | `copilot.tsx` – “Chat with Nomi coming soon” placeholder |
| Message list + input | ⚠️ | Input var, send handler yok; mesaj listesi yok |
| Voice trigger | ✅ | Home’da Mic FAB, Voice modal |
| Suggested Actions | ✅ | Plan, Reschedule, Summarize, Add task – bazıları boş `onPress: () => {}` |
| Apply/Cancel confirmation | ❌ | Hiçbir aksiyon onay istemiyor |
| Reschedule/Summarize logic | ❌ | API veya mock yok |

### Yapılacaklar
1. Chat UI: mesaj listesi (user + assistant), TextInput, send butonu
2. Mock chat: `useState` messages, basit “Nomi cevap veriyor” simülasyonu
3. Tüm Suggested Actions için **Apply / Cancel** modal/sheet
4. Reschedule: örn. `/ai/reschedule` endpoint veya mock
5. Summarize: örn. `/timeline/summary` veya mock

---

## D) ADVANCED TASK MODEL + TASK DETAIL

### MVP Gereksinim
- Task alanları: priority, duration estimate, energy level, life area, subtasks, recurrence
- Task Detail sayfası + edit
- Tasks listesinde filter/sort

### Mevcut Durum
| Özellik | Var mı? | Detay |
|---------|---------|-------|
| Task modeli | ⚠️ | Tasks = Events (`timeline_items` kind: event); ayrı task tablosu yok |
| priority, duration, energy, life area | ❌ | Yok |
| subtasks | ❌ | Yok |
| recurrence | ⚠️ | Event’te var (`recurrence_rule_id`) |
| Task Detail | ❌ | `event/[id]` var; task-specific detay yok |
| Filter/Sort | ❌ | Routine ekranında yok |

### Yapılacaklar
1. **Task ayrı entity** veya event’e metadata: `priority, durationEstimate, energyLevel, lifeArea, subtasks`
2. `task/[id]` veya event detayda task modu
3. Routine/Tasks listesinde filter (priority, life area), sort (date, priority)
4. UI: Priority picker, duration, energy, life area selectors

---

## E) CALENDAR VIEWS

### MVP Gereksinim
- Week ve Month view (Events için)
- Çakışan event’lerde conflict indicator

### Mevcut Durum
| Özellik | Var mı? | Detay |
|---------|---------|-------|
| Month view | ✅ | `events.tsx` – grid calendar, density colors |
| Week view | ⚠️ | events.tsx’de görünüm var; ayrı “week” modu belirsiz |
| Conflict indicator | ❌ | Çakışma tespiti ve gösterimi yok |

### Yapılacaklar
1. Week view: 7 gün yatay, saat bazlı timeline
2. Conflict: Aynı gün/saat aralığında 2+ event → overlap/conflict uyarısı (ikon veya renk)

---

## F) INSIGHTS IMPROVEMENTS

### MVP Gereksinim
- Weekly / Monthly toggle
- Life areas summary
- “Insufficient data” states
- AI suggestions section (mock)

### Mevcut Durum
| Özellik | Var mı? | Detay |
|---------|---------|-------|
| Period toggle | ❌ | Sabit dönem, toggle yok |
| Life areas | ⚠️ | Life areas store var; insights’ta summary yok |
| Insufficient data | ❌ | Boş/az veri durumu ayrıca işlenmiyor |
| AI suggestions | ❌ | Mock bölüm yok |
| API | ✅ | `/timeline/insights` – eventsCount, billsTotal vb. |

### Yapılacaklar
1. Weekly/Monthly toggle + API’ye period parametresi
2. Life areas’a göre özet (örn. event count per area)
3. `EmptyState` / “Yetersiz veri” mesajı
4. AI suggestions placeholder kartı

---

## G) SETTINGS COMPLETENESS

### MVP Gereksinim
- Theme, Language, Notifications, Quiet hours (mevcut)
- **Export my data** (JSON + share)
- **Delete account** (veya “Delete local data + sign out”)
- **Privacy: permission explanation screen**

### Mevcut Durum
| Özellik | Var mı? | Detay |
|---------|---------|-------|
| Theme | ✅ | warm/dark, theme store |
| Language | ✅ | EN/TR, API sync |
| Notifications | ✅ | daily_checkin, bill_amount_prompt, event_reminder |
| Quiet hours | ✅ | start/end |
| Export data | ❌ | Yok |
| Delete account | ❌ | Yok |
| Privacy/permissions | ❌ | Ayrı ekran yok; voice için mic permission var |

### Yapılacaklar
1. **Export**: Tüm local + API verilerini JSON’a çevir, `Share` API ile paylaş
2. **Delete**: “Delete local data & sign out” butonu + onay
3. **Privacy screen**: Mic, notifications, storage izinlerinin ne için kullanıldığını açıkla

---

## ENGINEERING REQUIREMENTS

### MVP Gereksinim
- Loading, Empty, Error states her ekranda
- Privacy-first, permission rationale
- Reusable components: Card, MetricRing, TimelineItem, EmptyState, ErrorState, BottomSheet
- 8pt grid, typography
- Accessibility: labels, min touch targets
- App Store readiness

### Mevcut Durum
| Özellik | Var mı? | Detay |
|---------|---------|-------|
| LoadingState | ✅ | Birçok ekranda kullanılıyor |
| EmptyState | ✅ | flow, inbox, vault, routine, events, network, goals |
| ErrorState | ❌ | Ayrı component yok; inline error UI |
| BottomSheet/Modal | ⚠️ | AddActionModal, HomeMenuModal; genel BottomSheet yok |
| Card | ✅ | AppCard, EventCard, BillCard |
| MetricRing | ⚠️ | ProgressRing var; MetricRing ayrı değil |
| TimelineItem | ✅ | EventCard, BillCard, TimelineRail |
| 8pt grid | ✅ | theme/tokens spacing |
| Typography | ✅ | typography scale |
| Accessibility | ⚠️ | `accessibilityLabel` pek yok |
| Permission rationale | ⚠️ | Mic için info var; push için daha az |

### Yapılacaklar
1. **ErrorState** component: retry butonu, mesaj
2. **BottomSheet** component: `@gorhom/bottom-sheet` veya basit Modal
3. Her icon için `accessibilityLabel`
4. Min touch target ~44pt
5. Permission ekranları: her izin için “Neden?” açıklaması

---

## TEKNOLOJİ STACK İYİLEŞTİRMELERİ

### Mevcut Stack
- **Expo 54**, React 19.1, React Native 0.81
- **expo-router 4**, Zustand, React Query, Supabase
- **i18next**, react-hook-form, zod

### Öneriler

| Alan | Öneri | Gerekçe |
|------|-------|--------|
| State | Zustand devam | Mevcut pattern uyumlu |
| Storage | AsyncStorage + taslak sync | Inbox/tasks için local-first, sonra API sync |
| BottomSheet | `@gorhom/bottom-sheet` | Convert modals, AI confirm için |
| Forms | react-hook-form + zod | Zaten kullanılıyor, tutarlı |
| Testing | Jest + React Native Testing Library | MVP sonrası kritik |
| E2E | Maestro veya Detox | Regression için |
| Error boundary | React Error Boundary | Crash’leri yakala |
| Analytics | Opt-in, privacy-first | App Store için |
| OTA Updates | EAS Update | Hızlı patch |
| CI/CD | GitHub Actions + EAS Build | Otomatik build |

### Paket Önerileri
```json
{
  "@gorhom/bottom-sheet": "~4.x",
  "react-native-reanimated": "~3.x",
  "react-native-gesture-handler": "~2.x"
}
```
(Bottom sheet için reanimated + gesture-handler gerekebilir)

---

## ÖNCELİKLİ GÖREV LİSTESİ

### P0 (Kritik – MVP için)
1. [ ] Inbox: InboxItem model + AsyncStorage persistence
2. [ ] Inbox: Convert to Task/Event/Habit/Bill (çalışan)
3. [ ] Navigation: Tab’ları MVP’ye göre düzenle (Home, Inbox, +, Insights, Settings)
4. [ ] Copilot: Apply/Cancel confirmation tüm aksiyonlarda
5. [ ] Settings: Export data + Delete local data
6. [ ] ErrorState component + tüm ekranlarda kullanım

### P1 (Önemli)
7. [ ] Copilot: Chat UI (message list + send)
8. [ ] Task: priority, duration, life area alanları
9. [ ] Task Detail sayfası
10. [ ] Insights: Weekly/Monthly toggle + insufficient data
11. [ ] Calendar: Conflict indicator
12. [ ] Privacy permissions screen

### P2 (İyileştirme)
13. [ ] Inbox: Undo for conversions
14. [ ] Voice capture → Inbox fallback
15. [ ] BottomSheet component
16. [ ] Accessibility labels
17. [ ] Task filter/sort

---

## FOLDER STRUCTURE ÖNERİSİ

```
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   ├── flow.tsx
│   │   ├── inbox.tsx
│   │   ├── insights.tsx
│   │   ├── system.tsx
│   │   ├── routine.tsx
│   │   ├── copilot.tsx
│   │   └── ...
│   └── (modal)/
│       ├── voice.tsx
│       └── ai-confirm.tsx  # Apply/Cancel
├── components/
│   ├── inbox/
│   │   ├── InboxItemCard.tsx
│   │   └── ConvertActionSheet.tsx
│   ├── copilot/
│   │   ├── ChatMessage.tsx
│   │   └── SuggestedActions.tsx
│   └── ui/
│       ├── ErrorState.tsx
│       └── BottomSheet.tsx
├── lib/
│   └── inbox-storage.ts
├── store/
│   └── inbox.ts  # Zustand for inbox items
└── types/
    └── inbox.ts
```

---

*Rapor tarihi: 2025-02-14 | LifeOS MVP Audit*
