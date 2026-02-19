/** Curated app suggestion for Add App Shortcut */
export interface CuratedApp {
  id: string;
  label: string;
  url: string;
  storeUrl: string;
  kind: 'fitness' | 'bank' | 'ticket' | 'transport' | 'other';
}

/** API shortcut response */
export interface AppShortcutDto {
  id: string | null;
  label: string;
  url: string;
  storeUrl: string;
}

/** Curated suggestions by category (no device scan – platform reality) */
export const CURATED_APPS: CuratedApp[] = [
  { id: 'apple-fitness', label: 'Apple Fitness', url: 'fitnessapp://', storeUrl: 'https://apps.apple.com/app/apple-fitness/id1208224953', kind: 'fitness' },
  { id: 'google-fit', label: 'Google Fit', url: 'googlefit://', storeUrl: 'https://play.google.com/store/apps/details?id=com.google.android.apps.fitness', kind: 'fitness' },
  { id: 'hevy', label: 'Hevy', url: 'hevy://', storeUrl: 'https://apps.apple.com/app/hevy-strength-tracker/id1436324651', kind: 'fitness' },
  { id: 'passolig', label: 'Passolig', url: 'passolig://', storeUrl: 'https://apps.apple.com/app/passolig/id707328424', kind: 'ticket' },
  { id: 'ziraat', label: 'Ziraat Bank', url: 'ziraatmobil://', storeUrl: 'https://apps.apple.com/app/ziraat-bankasi/id443588134', kind: 'bank' },
  { id: 'is-bank', label: 'İş Bankası', url: 'isbank://', storeUrl: 'https://apps.apple.com/app/is-bankasi/id359911934', kind: 'bank' },
];

/** Keyword-based suggestions for event title/category */
export function suggestAppsForEvent(title: string, category?: string): CuratedApp[] {
  const t = (title ?? '').toLowerCase();
  const cat = (category ?? '').toLowerCase();
  const ids: string[] = [];

  if (cat.includes('fitness') || t.includes('workout') || t.includes('gym') || t.includes('spor')) {
    ids.push('apple-fitness', 'google-fit', 'hevy');
  }
  if (t.includes('maç') || t.includes('stadium') || t.includes('futbol') || t.includes('football')) {
    ids.push('passolig');
  }
  if (t.includes('kira') || t.includes('rent') || t.includes('ödeme') || t.includes('payment') || t.includes('fatura')) {
    ids.push('ziraat', 'is-bank');
  }

  const uniq = [...new Set(ids)];
  const suggested = uniq
    .map((id) => CURATED_APPS.find((a) => a.id === id))
    .filter((a): a is CuratedApp => !!a);
  const rest = CURATED_APPS.filter((a) => !suggested.some((s) => s.id === a.id));
  return [...suggested, ...rest];
}

export function isValidDeepLink(url: string): boolean {
  if (!url.trim()) return false;
  return url.includes('://');
}
