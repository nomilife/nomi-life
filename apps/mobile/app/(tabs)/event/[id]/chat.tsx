import { useState, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { View, ScrollView, TextInput, Pressable } from 'react-native';
import { api } from '@/lib/api';
import { AppText, AppButton, LoadingState, SectionHeader } from '@/components/ui';
import { useTheme } from '@/theme';
import { warmColors } from '@/theme/tokens';
import { useAuthStore } from '@/store/auth';
import dayjs from 'dayjs';

/** Turuncu ve vintage tonlar — her kullanıcıya farklı bubble rengi */
const CHAT_BUBBLE_PALETTE = [
  { bg: '#C65D38', text: '#FFFFFF' }, // terracotta
  { bg: '#D4A84B', text: '#2D3748' }, // mustard
  { bg: '#C85A2B', text: '#FFFFFF' }, // burnt sienna
  { bg: '#DA9F4A', text: '#2D3748' }, // harvest gold
  { bg: '#B87333', text: '#FFFFFF' }, // copper
  { bg: '#E07C3C', text: '#FFFFFF' }, // warm orange
  { bg: '#D97706', text: '#FFFFFF' }, // amber
  { bg: '#87A96B', text: '#FFFFFF' }, // avocado (vintage yeşil)
] as const;

function getBubbleColorForUser(userId: string, allUserIds: string[]): (typeof CHAT_BUBBLE_PALETTE)[number] {
  const idx = allUserIds.indexOf(userId);
  if (idx < 0) return CHAT_BUBBLE_PALETTE[0];
  return CHAT_BUBBLE_PALETTE[idx % CHAT_BUBBLE_PALETTE.length];
}

interface Message {
  id: string;
  sender_user_id: string;
  sender_username?: string;
  text: string;
  created_at: string;
}

type EventDetail = Record<string, unknown> & { title?: string };

export default function EventChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.session?.user?.id ?? null);
  const [text, setText] = useState('');

  const { data: event } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api<EventDetail>(`/events/${id}`),
    enabled: !!id,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['conversation', id],
    queryFn: () => api<{ conversationId: string; messages: Message[] }>(`/events/${id}/conversation`),
    enabled: !!id,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  const postMutation = useMutation({
    mutationFn: (t: string) =>
      api(`/events/${id}/messages`, { method: 'POST', body: JSON.stringify({ text: t }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', id] });
      setText('');
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    postMutation.mutate(text.trim());
  };

  const messages = data?.messages ?? [];
  const uniqueUserIds = useMemo(() => {
    const seen = new Set<string>();
    messages.forEach((m) => seen.add(m.sender_user_id));
    return Array.from(seen);
  }, [messages]);

  if (isLoading) return <LoadingState />;

  const eventTitle = (event?.title as string) ?? 'Etkinlik';

  return (
    <View style={{ flex: 1, backgroundColor: warmColors.background }}>
      <View
        style={{
          padding: theme.spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: warmColors.border,
          backgroundColor: warmColors.surface,
        }}
      >
        <SectionHeader title={eventTitle} />
        <AppText variant="small" style={{ color: warmColors.textMuted, marginTop: 4 }}>
          Sohbet
        </AppText>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
      >
        {messages.length === 0 ? (
          <AppText variant="body" style={{ textAlign: 'center', color: warmColors.textMuted }}>
            Henüz mesaj yok. Konuşmayı başlat!
          </AppText>
        ) : (
          messages.map((m) => {
            const isOwn = currentUserId && m.sender_user_id === currentUserId;
            const { bg, text } = getBubbleColorForUser(m.sender_user_id, uniqueUserIds);
            return (
              <View
                key={m.id}
                style={{
                  marginBottom: theme.spacing.md,
                  padding: theme.spacing.md,
                  backgroundColor: bg,
                  borderRadius: theme.radius.md,
                  alignSelf: isOwn ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <AppText variant="small" style={{ fontWeight: '600', marginBottom: 2, color: text }}>
                  {m.sender_username ?? 'Anonim'}
                </AppText>
                <AppText variant="small" style={{ opacity: 0.85, color: text }}>
                  {dayjs(m.created_at).format('HH:mm')}
                </AppText>
                <AppText variant="body" style={{ marginTop: 4, color: text }}>
                  {m.text}
                </AppText>
              </View>
            );
          })
        )}
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
          borderTopWidth: 1,
          borderTopColor: warmColors.border,
          backgroundColor: warmColors.surface2,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Mesaj..."
          placeholderTextColor={warmColors.muted}
          style={{
            flex: 1,
            backgroundColor: warmColors.surface,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            color: warmColors.textPrimary,
            borderWidth: 1,
            borderColor: warmColors.border,
          }}
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || postMutation.isPending}
          style={{
            backgroundColor: warmColors.primary,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.radius.md,
            justifyContent: 'center',
          }}
        >
          <AppText style={{ color: '#fff' }}>Gönder</AppText>
        </Pressable>
      </View>
      <AppButton
        variant="ghost"
        onPress={() => router.back()}
        style={{ margin: theme.spacing.lg, alignSelf: 'flex-start' }}
      >
        Geri
      </AppButton>
    </View>
  );
}
