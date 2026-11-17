
import { View, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

export default function ExpensesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Разходи</Text>
      <Text style={styles.description}>
        Тук ще записваш и анализираш разходите за автомобилите.
      </Text>
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
});
