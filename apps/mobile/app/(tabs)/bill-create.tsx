import { useState } from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { api } from '@/lib/api';
import dayjs from 'dayjs';

export default function BillCreateScreen() {
  const { t } = useTranslation('vault');
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ vendor?: string; amount?: string; dueDate?: string }>();
  const queryClient = useQueryClient();
  const [vendor, setVendor] = useState(params.vendor ?? '');
  const [dueDate, setDueDate] = useState(params.dueDate ?? dayjs().add(1, 'month').format('YYYY-MM-DD'));
  const [amount, setAmount] = useState(params.amount ?? '');
  const [autopay, setAutopay] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api('/bills', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      router.back();
    },
  });

  const handleCreate = () => {
    if (!vendor.trim()) return;
    createMutation.mutate({
      vendor: vendor.trim(),
      dueDate,
      recurrence: 'monthly',
      autopay,
      amount: amount ? parseFloat(amount) : null,
    });
  };

  return (
    <View style={{ flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.background }}>
      <Text style={{ ...theme.typography.h2, color: theme.colors.text }}>{t('addBill')}</Text>
      <TextInput
        style={{
          ...theme.typography.body,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          marginTop: theme.spacing.md,
          color: theme.colors.text,
        }}
        placeholder="Vendor"
        value={vendor}
        onChangeText={setVendor}
        placeholderTextColor={theme.colors.textMuted}
      />
      <TextInput
        style={{
          ...theme.typography.body,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          marginTop: theme.spacing.md,
          color: theme.colors.text,
        }}
        placeholder="Due date (YYYY-MM-DD)"
        value={dueDate}
        onChangeText={setDueDate}
        placeholderTextColor={theme.colors.textMuted}
      />
      <TextInput
        style={{
          ...theme.typography.body,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
          marginTop: theme.spacing.md,
          color: theme.colors.text,
        }}
        placeholder="Amount (optional)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholderTextColor={theme.colors.textMuted}
      />
      <Pressable
        onPress={() => setAutopay(!autopay)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: theme.spacing.md,
        }}
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
          padding: theme.spacing.md,
          borderRadius: theme.radius.md,
          marginTop: theme.spacing.lg,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#fff', ...theme.typography.body }}>Create</Text>
      </Pressable>
    </View>
  );
}
