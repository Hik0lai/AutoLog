
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import colors from '../../../constants/colors';
import spacing from '../../../constants/spacing';
import typography from '../../../constants/typography';

export default function ServiceHistoryScreen({ route, navigation }) {
  const vehicle = route.params?.vehicle;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Сервизна история
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Vehicle information */}
      <View style={styles.vehicleCard}>
        <View style={styles.vehicleIcon}>
          <Ionicons
            name="car-sport"
            size={32}
            color={colors.primary}
          />
        </View>

        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleName}>
            {vehicle?.brand} {vehicle?.model}
          </Text>

          <Text style={styles.vehicleRegistration}>
            {vehicle?.registration_number}
          </Text>
        </View>
      </View>

      {/* Section heading */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Обслужвания
        </Text>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>0</Text>
        </View>
      </View>

      {/* Empty state */}
      <View style={styles.emptyCard}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="construct-outline"
            size={44}
            color={colors.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          Все още няма обслужвания
        </Text>

        <Text style={styles.emptyDescription}>
          Добави първото обслужване, за да започнеш
          да следиш сервизната история на автомобила.
        </Text>
      </View>

      {/* Add service button */}
      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('ServiceForm', { vehicle })
        }
      >
        <Ionicons
          name="add-circle-outline"
          size={23}
          color={colors.background}
        />

        <Text style={styles.addButtonText}>
          Добави обслужване
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
  },

  headerSpacer: {
    width: 42,
  },

  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },

  vehicleIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  vehicleInfo: {
    flex: 1,
  },

  vehicleName: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
  },

  vehicleRegistration: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
  },

  countBadge: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  countText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '700',
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },

  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: spacing.sm,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.lg,
  },

  addButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
});
