
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

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Липсва информация', 'Попълни всички полета.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      Alert.alert('Невалиден имейл', 'Провери въведения имейл адрес.');
      return;
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      Alert.alert(
        'Слаба парола',
        'Паролата трябва да съдържа поне 8 символа, една главна буква и една цифра.'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Грешка', 'Паролите не съвпадат.');
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await signUp(
        email.trim(),
        password,
        fullName.trim()
      );

      if (error) {
        Alert.alert('Грешка при регистрация', error.message);
        return;
      }

      if (data?.session) {
        Alert.alert(
          'Успешна регистрация',
          'Акаунтът ти е създаден успешно.'
        );
      } else {
        Alert.alert(
          'Почти готово!',
          'Изпратихме ти имейл за потвърждение. Отвори го и потвърди регистрацията си.'
        );

        navigation.navigate('Login');
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
            Създай своя акаунт и следи всичко за автомобила си.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Регистрация</Text>
          <Text style={styles.description}>
            Попълни данните, за да създадеш акаунт.
          </Text>

          <Text style={styles.label}>Име и фамилия</Text>
          <TextInput
            style={styles.input}
            placeholder="Твоето име"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
          />

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
            placeholder="Минимум 8 символа"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.label}>Повтори паролата</Text>
          <TextInput
            style={styles.input}
            placeholder="Въведи паролата отново"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Регистрация...' : 'Създай акаунт'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              Вече имаш акаунт?{' '}
              <Text style={styles.loginHighlight}>Влез тук</Text>
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
    marginBottom: 30,
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
    textAlign: 'center',
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
    marginBottom: 24,
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
    marginBottom: 18,
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
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: colors.muted,
    fontSize: 14,
  },
  loginHighlight: {
    color: colors.accent,
    fontWeight: '700',
  },
});
