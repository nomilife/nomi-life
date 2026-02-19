import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { View, Alert, Linking } from 'react-native';
import { api } from '@/lib/api';
import { AppCard, AppText, AppButton, AppInput, LoadingState, SectionHeader } from '@/components/ui';
import { useTheme } from '@/theme';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [appLinkInput, setAppLinkInput] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['bill', id],
    queryFn: () => api<Record<string, unknown>>(`/bills/${id}`),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (body: { appLink?: string | null }) =>
      api(`/bills/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill', id] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
  });

  const amountMutation = useMutation({
    mutationFn: (val: number) =>
      api(`/bills/${id}/amount`, { method: 'POST', body: JSON.stringify({ amount: val }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill', id] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      setAmount('');
    },
  });

  const handleAddAmount = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    amountMutation.mutate(num);
  };

  if (isLoading) return <LoadingState />;
  if (error || !data) {
    return (
      <View style={{ flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.background }}>
        <AppText variant="body" color="danger">Failed to load bill</AppText>
        <AppButton variant="secondary" onPress={() => router.back()} style={{ marginTop: theme.spacing.lg }}>
          Go back
        </AppButton>
      </View>
    );
  }

  const vendor = (data.vendor as string) ?? '';
  const billAmount = data.amount as number | null;
  const dueDate = data.dueDate as string;
  const autopay = (data.autopay as boolean) ?? false;
  const currency = (data.currency as string) ?? 'TRY';
  const appLink = (data.appLink as string | null) ?? null;

  const handleOpenApp = async () => {
    const url = appLink ?? (appLinkInput.trim() || null);
    if (!url) return;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Hata', 'Bu adres açılamıyor. Ödeme uygulamasının URL şemasını kontrol edin (örn. myapp://pay).');
      }
    } catch {
      Alert.alert('Hata', 'Uygulama açılamadı.');
    }
  };

  const handleSaveAppLink = () => {
    const v = appLinkInput.trim() || null;
    updateMutation.mutate({ appLink: v });
  };

  return (
    <View style={{ flex: 1, padding: theme.spacing.lg, backgroundColor: theme.colors.background }}>
      <SectionHeader title={vendor} />
      <AppCard>
        <AppText variant="caption" color="secondary">
          Due {dayjs(dueDate).format('MMM D, YYYY')}
        </AppText>
        {autopay && (
          <AppText variant="small" color="accent" style={{ marginTop: theme.spacing.xs }}>Auto-pay</AppText>
        )}
        {billAmount != null ? (
          <AppText variant="title" style={{ marginTop: theme.spacing.md }}>
            {billAmount} {currency}
          </AppText>
        ) : (
          <View style={{ marginTop: theme.spacing.md }}>
            <AppText variant="body" color="warning">Amount needed</AppText>
            <AppInput
              label="Amount"
              placeholder="0"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <AppButton
              variant="primary"
              onPress={handleAddAmount}
              loading={amountMutation.isPending}
            >
              Save amount
            </AppButton>
          </View>
        )}
      </AppCard>

      <AppText variant="small" color="muted" style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
        Ödeme uygulaması (kira, elektrik, su vb.)
      </AppText>
      <AppInput
        placeholder="https://... veya myapp://..."
        value={appLinkInput || appLink || ''}
        onChangeText={setAppLinkInput}
      />
      {(appLinkInput.trim() && appLinkInput !== appLink) && (
        <AppButton variant="secondary" onPress={handleSaveAppLink} loading={updateMutation.isPending} style={{ marginTop: theme.spacing.sm }}>
          Kaydet
        </AppButton>
      )}
      {(appLink || appLinkInput.trim()) && (
        <AppButton
          variant="primary"
          onPress={handleOpenApp}
          style={{ marginTop: theme.spacing.lg, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}
        >
          <Ionicons name="open-outline" size={20} color="#fff" />
          {vendor} uygulamasını aç
        </AppButton>
      )}

      <AppButton variant="ghost" onPress={() => router.back()} style={{ marginTop: theme.spacing.lg }}>
        Back
      </AppButton>
    </View>
  );
}
