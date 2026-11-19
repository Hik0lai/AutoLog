
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const colors = {
  background: '#101319',
  card: '#1B202A',
  accent: '#35B6E8',
  text: '#F4F7FB',
  muted: '#929BAA',
  danger: '#EF5B64',
  warning: '#F5A623',
  success: '#35C98A',
};

const variants = {
  info: {
    color: colors.accent,
    icon: 'i',
  },
  success: {
    color: colors.success,
    icon: '✓',
  },
  warning: {
    color: colors.warning,
    icon: '!',
  },
  error: {
    color: colors.danger,
    icon: 'x',
  },
};

export default function CustomAlert({
  visible,
  title,
  message,
  type = 'info',
  confirmText = 'Разбрах',
  onConfirm,
  cancelText,
  onCancel,
}) {
  if (!visible) {
    return null;
  }

  const variant = variants[type] || variants.info;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${variant.color}20` },
          ]}
        >
          <Text style={[styles.icon, { color: variant.color }]}>
            {variant.icon}
          </Text>
        </View>

        <Text style={styles.title}>{title}</Text>

        <Text style={styles.message}>{message}</Text>

        <View style={styles.actions}>
          {cancelText && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <Text style={styles.confirmText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 19, 25, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
    elevation: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#303846',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#303846',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});
