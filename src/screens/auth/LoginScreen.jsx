
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../context/AuthContext';

const colors = {
  background: '#101319',
  card: '#1B202A',
  accent: '#35B6E8',
  text: '#F4F7FB',
  muted: '#929BAA',
  danger: '#EF5B64',
};

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Липсва информация', 'Попълни имейл и парола.');
      return;
    }

    try {
      setLoading(true);

      const { error } = await signIn(email.trim(), password);

      if (error) {
        Alert.alert('Грешка при вход', error.message);
      }
    } catch (error) {
      Alert.alert('Грешка', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>AutoLog</Text>
          <Text style={styles.subtitle}>
            Всичко за автомобила ти на едно място.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Добре дошъл!</Text>
          <Text style={styles.description}>
            Влез в своя акаунт, за да продължиш.
          </Text>

          <Text style={styles.label}>Имейл</Text>
          <TextInput
            style={styles.input}
            placeholder="example@email.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Парола</Text>
          <TextInput
            style={styles.input}
            placeholder="Въведи парола"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Влизане...' : 'Вход'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              Нямаш акаунт?{' '}
              <Text style={styles.registerHighlight}>Регистрирай се</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    color: colors.accent,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 24,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '700',
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 28,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#303846',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    color: colors.muted,
    fontSize: 14,
  },
  registerHighlight: {
    color: colors.accent,
    fontWeight: '700',
  },
});
