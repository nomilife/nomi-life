-- App link: kira/elektrik ödemeleri ve spor eklentileri için ilgili uygulamaya yönlendirme
ALTER TABLE habits ADD COLUMN IF NOT EXISTS app_link text;
