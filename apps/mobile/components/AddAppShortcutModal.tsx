import { useState } from 'react';
import { Modal, View, Pressable, TextInput, ScrollView, Alert } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { AppText } from '@/components/ui';
import { api } from '@/lib/api';
import {
  CURATED_APPS,
  suggestAppsForEvent,
  isValidDeepLink,
  type CuratedApp,
} from '@/lib/event-types';

interface AddAppShortcutModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called with created shortcut id – parent binds it to event/habit */
  onSelect: (shortcutId: string) => void;
  eventTitle?: string;
  eventCategory?: string;
}

export function AddAppShortcutModal({
  visible,
  onClose,
  onSelect,
  eventTitle = '',
  eventCategory = '',
}: AddAppShortcutModalProps) {
  const theme = useTheme();
  const { t } = useTranslation('event');
  const [search, setSearch] = useState('');
  const [customLink, setCustomLink] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const suggested = suggestAppsForEvent(eventTitle, eventCategory);
  const filtered = search.trim()
    ? CURATED_APPS.filter(
        (a) =>
          a.label.toLowerCase().includes(search.toLowerCase()) ||
          a.id.toLowerCase().includes(search.toLowerCase())
      )
    : suggested;

  const createMutation = useMutation({
    mutationFn: (body: { title?: string; url: string; kind: string; storeUrl?: string }) =>
      api<{ id: string }>('/shortcuts', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (data) => {
      onSelect(data.id);
      onClose();
    },
    onError: (e) => Alert.alert(t('invalidUrl', 'Invalid URL'), (e as Error).message),
  });

  const handleSelect = (app: CuratedApp) => {
    createMutation.mutate({
      title: app.label,
      url: app.url,
      kind: app.kind,
      storeUrl: app.storeUrl || undefined,
    });
  };

  const handleSaveCustom = () => {
    const link = customLink.trim();
    if (!isValidDeepLink(link)) {
      Alert.alert(t('invalidUrl'), t('invalidUrl'));
      return;
    }
    createMutation.mutate({
      title: 'Custom app',
      url: link,
      kind: 'other',
    });
    setCustomLink('');
    setShowCustom(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.xxl,
            borderTopRightRadius: theme.radius.xxl,
            padding: theme.spacing.lg,
            maxHeight: '70%',
          }}
        >
          <AppText variant="title" style={{ color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }}>
            {t('selectApp')}
          </AppText>
          <TextInput
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
            style={{
              ...theme.typography.body,
              color: theme.colors.text,
              backgroundColor: theme.colors.surface2,
              borderRadius: theme.radius.lg,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          />

          {showCustom ? (
            <View>
              <AppText variant="caption" color="muted" style={{ marginBottom: theme.spacing.sm }}>
                {t('customLink')}
              </AppText>
              <TextInput
                placeholder={t('customLinkPlaceholder')}
                placeholderTextColor={theme.colors.textMuted}
                value={customLink}
                onChangeText={setCustomLink}
                style={{
                  ...theme.typography.body,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface2,
                  borderRadius: theme.radius.lg,
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              />
              <Pressable
                onPress={handleSaveCustom}
                disabled={createMutation.isPending}
                style={{
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                }}
              >
                <AppText variant="body" style={{ color: '#fff', fontWeight: '600' }}>{t('save')}</AppText>
              </Pressable>
              <Pressable onPress={() => setShowCustom(false)} style={{ marginTop: theme.spacing.sm, alignItems: 'center' }}>
                <AppText variant="body" color="primary">← {t('cancel')}</AppText>
              </Pressable>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {filtered.map((app) => (
                <Pressable
                  key={app.id}
                  onPress={() => handleSelect(app)}
                  disabled={createMutation.isPending}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.lg,
                    marginBottom: theme.spacing.xs,
                    backgroundColor: theme.colors.surface2,
                  }}
                >
                  <Ionicons name="phone-portrait-outline" size={24} color={theme.colors.primary} style={{ marginRight: theme.spacing.md }} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="body" style={{ color: theme.colors.textPrimary }}>{app.label}</AppText>
                    {app.url ? (
                      <AppText variant="small" color="muted">{app.url}</AppText>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </Pressable>
              ))}
              <Pressable
                onPress={() => setShowCustom(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.lg,
                  marginBottom: theme.spacing.xs,
                  backgroundColor: theme.colors.surface2,
                }}
              >
                <Ionicons name="link-outline" size={24} color={theme.colors.primary} style={{ marginRight: theme.spacing.md }} />
                <AppText variant="body" style={{ color: theme.colors.textPrimary }}>{t('customLink')}</AppText>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </Pressable>
            </ScrollView>
          )}

          <Pressable onPress={onClose} style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
            <AppText variant="body" color="muted">{t('cancel')}</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
