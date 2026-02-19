import { View, Image } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export type AvatarParticipant = {
  initials?: string;
  imageUri?: string;
  /** E-posta veya ad ile initials otomatik hesaplanır */
  email?: string;
  displayName?: string;
};

interface AvatarStackProps {
  count: number;
  maxShow?: number;
  /** Profil fotoğrafları veya baş harfler - varsa bunlar gösterilir */
  participants?: AvatarParticipant[];
}

const AVATAR_COLORS = ['#E07C3C', '#0D9488', '#8B5CF6', '#D97706', '#DC2626', '#059669'];

function getInitials(email?: string, name?: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) {
    const prefix = email.split('@')[0];
    return prefix.slice(0, 2).toUpperCase();
  }
  return '?';
}

export function AvatarStack({ count, maxShow = 4, participants = [] }: AvatarStackProps) {
  const theme = useTheme();
  const hasParticipants = participants.length > 0;
  const showCount = hasParticipants ? Math.min(participants.length, maxShow) : Math.min(count, maxShow);
  const extra = hasParticipants
    ? Math.max(0, participants.length - maxShow)
    : Math.max(0, count - maxShow);

  const items = hasParticipants
    ? participants.slice(0, showCount).map((p) => ({
        ...p,
        initials: p.initials ?? getInitials(p.email, p.displayName),
      }))
    : Array.from({ length: showCount }).map(() => ({ initials: '?' }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {items.map((p, i) => (
        <View
          key={i}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: hasParticipants && p.initials !== '?' ? AVATAR_COLORS[i % AVATAR_COLORS.length] : (theme.colors.primaryMuted ?? '#E8D5C4'),
            marginLeft: i === 0 ? 0 : -10,
            borderWidth: 2,
            borderColor: theme.colors.surface ?? '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {p.imageUri ? (
            <Image source={{ uri: p.imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <AppText variant="small" style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>
              {p.initials ?? '?'}
            </AppText>
          )}
        </View>
      ))}
      {extra > 0 ? (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.colors.surface2,
            marginLeft: -10,
            borderWidth: 2,
            borderColor: theme.colors.surface ?? '#fff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText variant="small" color="secondary" style={{ fontWeight: '600' }}>
            +{extra}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
