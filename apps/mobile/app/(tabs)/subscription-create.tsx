import { useState } from 'react';
import { View, TextInput, Pressable, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import dayjs from 'dayjs';
import { ScreenHeader } from '@/components/ScreenHeader';

export default function SubscriptionCreateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'weekly'>('monthly');
  const [nextBillDate, setNextBillDate] = useState(dayjs().add(1, 'month').format('YYYY-MM-DD'));
  const [autopay, setAutopay] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      router.back();
    },
    onError: (e) => {
      Alert.alert('Hata', (e as Error).message);
    },
  });

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Eksik', 'Başlık gerekli.');
      return;
    }
    if (!vendor.trim()) {
      Alert.alert('Eksik', 'Vendor (şirket/ad) gerekli.');
      return;
    }
    createMutation.mutate({
      title: title.trim(),
      vendor: vendor.trim(),
      amount: amount ? parseFloat(amount) : null,
      billingCycle,
      nextBillDate,
      autopay,
    });
  };

  const inputStyle = {
    ...theme.typography.body,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  };

  const CYCLE_OPTIONS = ['monthly', 'yearly', 'weekly'] as const;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader showBack title="New Subscription" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
      >
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Subscription name"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Vendor (Netflix, Spotify, etc.)"
          value={vendor}
          onChangeText={setVendor}
          placeholderTextColor={theme.colors.textMuted}
        />
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Amount (optional)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholderTextColor={theme.colors.textMuted}
        />
        <Text style={{ ...theme.typography.small, color: theme.colors.textMuted, marginBottom: theme.spacing.sm }}>
          Billing cycle
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          {CYCLE_OPTIONS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setBillingCycle(c)}
              style={{
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                borderRadius: theme.radius.full,
                backgroundColor: billingCycle === c ? theme.colors.primary : theme.colors.surface2,
              }}
            >
              <Text style={{ ...theme.typography.small, color: billingCycle === c ? '#fff' : theme.colors.text }}>
                {c}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          style={[inputStyle, { marginBottom: theme.spacing.md }]}
          placeholder="Next bill date (YYYY-MM-DD)"
          value={nextBillDate}
          onChangeText={setNextBillDate}
          placeholderTextColor={theme.colors.textMuted}
        />
        <Pressable
          onPress={() => setAutopay(!autopay)}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              borderWidth: 2,
              borderColor: theme.colors.border,
              backgroundColor: autopay ? theme.colors.primary : 'transparent',
            }}
          />
          <Text style={{ ...theme.typography.body, color: theme.colors.text, marginLeft: theme.spacing.sm }}>
            Auto-pay
          </Text>
        </Pressable>
        <Pressable
          onPress={handleCreate}
          disabled={createMutation.isPending}
          style={{
            backgroundColor: theme.colors.primary,
            padding: theme.spacing.lg,
            borderRadius: theme.radius.lg,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', ...theme.typography.body, fontWeight: '600' }}>Create</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
