# Veritabanı Migration'ları

## app_link (Habit & Bill/Event uygulama yönlendirmesi)

Habits tablosuna `app_link` sütunu ekler. Kira, elektrik, spor salonu vb. için ilgili uygulamaya yönlendirme için kullanılır.

### Uygulama

**Seçenek 1:** Supabase CLI ile (proje bağlıysa)
```bash
cd apps/api
pnpm db:migrate
# veya
npx supabase db push
```

**Seçenek 2:** Supabase Dashboard SQL Editor ile
1. [Supabase Dashboard](https://supabase.com/dashboard) → Projen → SQL Editor
2. Aşağıdaki SQL'i çalıştır:

```sql
ALTER TABLE habits ADD COLUMN IF NOT EXISTS app_link text;
```
