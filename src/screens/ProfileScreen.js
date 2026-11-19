
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import colors from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import CustomAlert from '../components/common/CustomAlert';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Разбрах',
    cancelText: undefined,
    onConfirm: null,
  });

  const hideAlert = () => {
    setAlert((current) => ({
      ...current,
      visible: false,
    }));
  };

  const showAlert = ({
    title,
    message,
    type = 'info',
    confirmText = 'Разбрах',
    cancelText,
    onConfirm,
  }) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  const handleLogout = () => {
    showAlert({
      title: 'Изход от профила',
      message: 'Сигурен ли си, че искаш да излезеш?',
      type: 'warning',
      confirmText: 'Изход',
      cancelText: 'Отказ',
      onConfirm: performLogout,
    });
  };

  const performLogout = async () => {
    hideAlert();

    try {
      setLoading(true);

      const { error } = await signOut();

      if (error) {
        showAlert({
          title: 'Грешка',
          message: error.message,
          type: 'error',
        });
      }
    } catch (error) {
      showAlert({
        title: 'Грешка',
        message: error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Профил</Text>

      <Text style={styles.description}>
        Тук ще управляваш своя профил и настройките на приложението.
      </Text>

      <Text style={styles.email}>
        {user?.email}
      </Text>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.logoutText}>
            Изход от профила
          </Text>
        )}
      </TouchableOpacity>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={alert.onConfirm || hideAlert}
        onCancel={hideAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  email: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 24,
  },
  logoutButton: {
    backgroundColor: '#EF5B64',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
