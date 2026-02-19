import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, TextInput, Pressable, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { AppText, ConfirmModal } from '@/components/ui';
import { NomiHeader, ChatBubble, ProposalCard } from '@/components/nomi';
import { useChatStore } from '@/store/chat';
import { api, API_TIMEOUT_AI } from '@/lib/api';
import { nomiColors } from '@/theme/tokens';

export default function CopilotScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { messages, proposalCard, pendingQuery, addMessage, setProposalCard, setPendingQuery, confirmProposal } = useChatStore();

  const chatMutation = useMutation({
    mutationFn: (msgs: Array<{ role: 'user' | 'assistant'; content: string }>) =>
      api<{ content: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: msgs }),
        timeoutMs: API_TIMEOUT_AI,
      }),
    onSuccess: (data, msgs) => {
      addMessage({ role: 'assistant', content: data.content, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    },
    onError: (e) => {
      Alert.alert('Hata', (e as Error).message);
    },
  });

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || chatMutation.isPending) return;
    setInput('');
    addMessage({ role: 'user', content: trimmed, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    const allMsgs = [...messages, { role: 'user' as const, content: trimmed }];
    chatMutation.mutate(allMsgs);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages]);

  useEffect(() => {
    const q = pendingQuery?.trim();
    if (!q || chatMutation.isPending) return;
    setPendingQuery(null);
    setInput('');
    const prevMessages = useChatStore.getState().messages;
    addMessage({ role: 'user', content: q, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    chatMutation.mutate([...prevMessages, { role: 'user' as const, content: q }]);
  }, [pendingQuery, addMessage]);

  const primary = (theme.colors as { primary?: string }).primary ?? nomiColors.primary;

  const quickChips = [
    { label: 'Bugün ne var?', onPress: () => setInput('Bugün takvimimde ne var?') },
    { label: 'Takvimim nasıl?', onPress: () => setInput('Bu aralar takvimim nasıl gidiyor?') },
    { label: 'Plan tomorrow', onPress: () => setInput('Plan my tomorrow') },
    { label: 'Optimize week', onPress: () => setInput('Optimize my week') },
  ];

  const handleConfirmProposal = () => {
    confirmProposal();
    setShowConfirm(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F5EDE4' }}>
      <View style={{ paddingTop: 48 }}>
        <NomiHeader
          title="NOMI AI"
          subtitle="COPILOT SYSTEMS"
          right={{
            search: () => {},
            settings: () => router.push('/(tabs)/system' as never),
          }}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => (
          <View key={m.id} style={{ marginBottom: theme.spacing.md }}>
            <ChatBubble role={m.role} content={m.content} timestamp={m.timestamp} />
          </View>
        ))}

        {proposalCard && (
          <View style={{ marginBottom: theme.spacing.lg }}>
            <ProposalCard
              card={proposalCard}
              onConfirm={() => setShowConfirm(true)}
              onCancel={() => setProposalCard(null)}
            />
          </View>
        )}

        {chatMutation.isPending && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: primary + '30', alignItems: 'center', justifyContent: 'center' }}>
              <AppText variant="small" style={{ color: primary, fontWeight: '700' }}>N</AppText>
            </View>
            <View style={{ padding: theme.spacing.md, backgroundColor: '#fff', borderRadius: theme.radius.xl, borderWidth: 1, borderColor: '#E8D5C4' }}>
              <AppText variant="small" color="muted">NOMI düşünüyor...</AppText>
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          {quickChips.map((chip) => (
            <Pressable
              key={chip.label}
              onPress={chip.onPress}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.full,
                backgroundColor: '#FFF8F0',
                borderWidth: 1,
                borderColor: 'rgba(224, 124, 60, 0.3)',
              }}
            >
              <AppText variant="small" style={{ color: primary, fontWeight: '600' }}>{chip.label}</AppText>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg, backgroundColor: '#F5EDE4' }}
      >
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
            placeholder="Type a message or ask NOMI."
            placeholderTextColor="#94a3b8"
            returnKeyType="send"
            editable={!chatMutation.isPending}
            style={{
              flex: 1,
              ...theme.typography.body,
              color: '#2D3748',
              backgroundColor: '#fff',
              borderRadius: theme.radius.xl,
              padding: theme.spacing.md,
              borderWidth: 1,
              borderColor: '#E8D5C4',
            }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: input.trim() && !chatMutation.isPending ? primary : '#E8D5C4',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(modal)/voice' as never)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="mic" size={22} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={showConfirm}
        title="Confirm Schedule"
        message="Apply this schedule to your calendar?"
        applyLabel="Confirm"
        cancelLabel="Cancel"
        onApply={handleConfirmProposal}
        onCancel={() => setShowConfirm(false)}
      />
    </View>
  );
}
