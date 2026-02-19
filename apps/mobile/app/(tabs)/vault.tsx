import { View, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { useTheme } from '@/theme';
import { BillCard } from '@/components/timeline/BillCard';
import {
  SectionHeader,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/ui';

type Bill = {
  id: string;
  vendor: string;
  amount?: number | null;
  dueDate: string;
  autopay?: boolean;
  currency?: string;
};

export default function VaultScreen() {
  const { t } = useTranslation('vault');
  const theme = useTheme();
  const router = useRouter();

  const { data: bills = [], isLoading, error, refetch } = useQuery({
    queryKey: ['bills', 'upcoming'],
    queryFn: () => api<Bill[]>(`/bills?range=upcoming`),
    staleTime: 60_000,
  });

  if (isLoading) return <LoadingState />;
  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <ErrorState
          message={(error as Error).message}
          onRetry={() => refetch()}
          retryLabel={t('retry', 'Tekrar dene')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}
    >
      <SectionHeader
        title={t('bills')}
        action={
          <Link href="/(tabs)/bill-create" asChild>
            <AppButton variant="primary">{t('addBill')}</AppButton>
          </Link>
        }
      />
      {bills.length === 0 ? (
        <EmptyState
          title={t('noBills', 'No bills yet')}
          message={t('noBillsHint', 'Add a bill or subscription to track.')}
          actionLabel={t('addBill')}
          onAction={() => router.push('/(tabs)/bill-create')}
        />
      ) : (
        bills.map((b) => (
          <View key={b.id} style={{ marginBottom: theme.spacing.md }}>
            <BillCard
              id={b.id}
              vendor={b.vendor}
              amount={b.amount}
              dueDate={b.dueDate}
              autopay={b.autopay}
              currency={b.currency ?? 'TRY'}
            />
          </View>
        ))
      )}
    </ScrollView>
  );
}
