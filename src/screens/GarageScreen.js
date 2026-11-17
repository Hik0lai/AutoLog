
import { View, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

export default function GarageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Моят гараж</Text>
      <Text style={styles.description}>
        Тук ще добавяш и управляваш своите автомобили.
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
