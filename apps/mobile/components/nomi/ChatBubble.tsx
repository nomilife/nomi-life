import { View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';
import { nomiColors } from '@/theme/tokens';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  showAvatar?: boolean;
}

export function ChatBubble({ role, content, timestamp, showAvatar = true }: ChatBubbleProps) {
  const theme = useTheme();
  const primary = (theme.colors as { primary?: string }).primary ?? nomiColors.primary;
  const isUser = role === 'user';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        alignItems: 'flex-end',
        gap: theme.spacing.sm,
      }}
    >
      {!isUser && showAvatar && (
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: primary + '30',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="NOMI avatar"
        >
          <AppText variant="small" style={{ color: primary, fontWeight: '700' }}>N</AppText>
        </View>
      )}
      <View
        style={{
          backgroundColor: isUser ? primary : '#fff',
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: isUser ? 'transparent' : '#E8D5C4',
          ...theme.elevations[1],
        }}
      >
        <AppText variant="body" style={{ color: isUser ? '#fff' : '#2D3748' }}>
          {content}
        </AppText>
        {timestamp && (
          <AppText variant="small" style={{ color: isUser ? 'rgba(255,255,255,0.8)' : '#718096', marginTop: 4, fontSize: 10 }}>
            {timestamp} • {isUser ? 'You' : 'NOMI'}
          </AppText>
        )}
      </View>
      {isUser && showAvatar && (
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: primary + '50',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityLabel="User avatar"
        >
          <AppText variant="small" style={{ color: '#fff', fontWeight: '700' }}>U</AppText>
        </View>
      )}
    </View>
  );
}
