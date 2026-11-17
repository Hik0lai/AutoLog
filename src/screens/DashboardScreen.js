
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import colors from '../constants/colors';
import spacing from '../constants/spacing';
import typography from '../constants/typography';

export default function DashboardScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Добре дошъл!</Text>
          <Text style={styles.title}>Моят AutoLog</Text>
        </View>

        <TouchableOpacity style={styles.profileButton}>
          <Ionicons
            name="person-outline"
            size={23}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Garage section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Моят гараж</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Гараж')}
        >
          <Text style={styles.seeAll}>Виж всички</Text>
        </TouchableOpacity>
      </View>

      {/* Main vehicle card */}
      <TouchableOpacity
        style={styles.vehicleCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Гараж')}
      >
        <View style={styles.vehicleImage}>
          <Ionicons
            name="car-sport"
            size={105}
            color={colors.primary}
          />

          <View style={styles.imageLabel}>
            <Ionicons
              name="camera-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={styles.imageLabelText}>
              Добави снимка
            </Text>
          </View>
        </View>

        <View style={styles.vehicleInfo}>
          <View>
            <Text style={styles.vehicleTitle}>
              Твоят автомобил
            </Text>
            <Text style={styles.vehicleSubtitle}>
              Все още няма добавен автомобил
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={23}
            color={colors.primary}
          />
        </View>
      </TouchableOpacity>

      {/* Statistics */}
      <Text style={styles.sectionTitle}>
        Обобщение
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons
              name="car-outline"
              size={22}
              color={colors.primary}
            />
          </View>

          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Автомобили</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons
              name="wallet-outline"
              size={22}
              color={colors.success}
            />
          </View>

          <Text style={styles.statValue}>0.00 лв.</Text>
          <Text style={styles.statLabel}>Разходи този месец</Text>
        </View>
      </View>

      {/* Reminders */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Напомняния
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('Напомняния')}
        >
          <Text style={styles.seeAll}>Виж всички</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons
            name="notifications-outline"
            size={23}
            color={colors.warning}
          />
        </View>

        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>
            Няма предстоящи напомняния
          </Text>
          <Text style={styles.infoDescription}>
            Добави автомобил и създай първото си напомняне.
          </Text>
        </View>
      </View>

      {/* Recent activity */}
      <Text style={styles.sectionTitle}>
        Последна активност
      </Text>

      <View style={styles.infoCard}>
        <View style={styles.infoIcon}>
          <Ionicons
            name="time-outline"
            size={23}
            color={colors.primary}
          />
        </View>

        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>
            Все още няма дейности
          </Text>
          <Text style={styles.infoDescription}>
            Сервизната история ще се показва тук.
          </Text>
        </View>
      </View>

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
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },

  greeting: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },

  title: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },

  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },

  seeAll: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },

  vehicleCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },

  vehicleImage: {
    height: 190,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  imageLabel: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  imageLabelText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },

  vehicleInfo: {
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  vehicleTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },

  vehicleSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },

  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },

  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  statValue: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },

  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  infoText: {
    flex: 1,
  },

  infoTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },

  infoDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
});
