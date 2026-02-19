import { Modal, View, Pressable } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { AppButton } from './AppButton';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  applyLabel?: string;
  cancelLabel?: string;
  onApply: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  applyLabel = 'Uygula',
  cancelLabel = 'İptal',
  onApply,
  onCancel,
}: ConfirmModalProps) {
  const theme = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing.xl,
        }}
        onPress={onCancel}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 340,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xl,
            padding: theme.spacing.xl,
          }}
        >
          <AppText variant="h2" style={{ color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }}>
            {title}
          </AppText>
          {message ? (
            <AppText variant="body" color="muted" style={{ marginBottom: theme.spacing.lg }}>
              {message}
            </AppText>
          ) : null}
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, justifyContent: 'flex-end' }}>
            <AppButton variant="secondary" onPress={onCancel}>
              {cancelLabel}
            </AppButton>
            <AppButton
              variant="primary"
              onPress={() => {
                onCancel();
                onApply();
              }}
            >
              {applyLabel}
            </AppButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
