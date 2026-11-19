
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import typography from '../../constants/typography';

export default function VehicleDetailsScreen({ route, navigation }) {
  const vehicle = route.params?.vehicle;

  if (!vehicle) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Информацията за автомобила не е намерена.
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatMileage = (mileage) =>
    `${Number(mileage || 0).toLocaleString('bg-BG')} км`;

  const fuelLabels = {
    petrol: 'Бензин',
    diesel: 'Дизел',
    electric: 'Електричество',
    hybrid: 'Хибрид',
    lpg: 'Газ (LPG)',
    cng: 'Метан (CNG)',
    none: 'Няма',
  };

  const getFuelLabel = (fuel) =>
    fuelLabels[fuel?.toLowerCase()] || fuel || 'Не е посочено';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIcon}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Автомобил</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.heroCard}>
        <View style={styles.carIconContainer}>
          <Ionicons
            name="car-sport"
            size={76}
            color={colors.primary}
          />
        </View>

        <Text style={styles.brand}>
          {vehicle.brand} {vehicle.model}
        </Text>

        <Text style={styles.year}>
          {vehicle.year || 'Година не е посочена'}
        </Text>

        <View style={styles.registrationBadge}>
          <Ionicons
            name="card-outline"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.registrationText}>
            {vehicle.registration_number}
          </Text>
        </View>
      </View>

      <View style={styles.mileageCard}>
        <View style={styles.mileageIcon}>
          <Ionicons
            name="speedometer-outline"
            size={25}
            color={colors.primary}
          />
        </View>

        <View>
          <Text style={styles.sectionLabel}>ТЕКУЩ ПРОБЕГ</Text>
          <Text style={styles.mileageValue}>
            {formatMileage(vehicle.mileage)}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Основна информация
      </Text>

      <View style={styles.infoCard}>
        <InfoRow
          icon="calendar-outline"
          label="Година"
          value={vehicle.year}
        />

        <InfoRow
          icon="card-outline"
          label="Регистрационен номер"
          value={vehicle.registration_number}
        />

        <InfoRow
          icon="barcode-outline"
          label="VIN"
          value={vehicle.vin || 'Не е посочен'}
        />

        <InfoRow
          icon="speedometer-outline"
          label="Пробег"
          value={formatMileage(vehicle.mileage)}
        />
      </View>

      <Text style={styles.sectionTitle}>
        Двигател и гориво
      </Text>

      <View style={styles.infoCard}>
        <InfoRow
          icon="hardware-chip-outline"
          label="Двигател"
          value={vehicle.engine || 'Не е посочен'}
        />

        <InfoRow
          icon="flame-outline"
          label="Основно гориво"
          value={getFuelLabel(vehicle.primary_fuel)}
        />

        <InfoRow
          icon="water-outline"
          label="Допълнително гориво"
          value={getFuelLabel(vehicle.additional_fuel)}
          isLast
        />
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, isLast }) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.textSecondary}
        />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>
          {value !== null && value !== undefined && value !== ''
            ? String(value)
            : 'Не е посочено'}
        </Text>
      </View>
    </View>
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

  backIcon: {
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

  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },

  carIconContainer: {
    width: 130,
    height: 110,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  brand: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    textAlign: 'center',
  },

  year: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: spacing.xs,
  },

  registrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    marginTop: spacing.lg,
  },

  registrationText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    letterSpacing: 1,
  },

  mileageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },

  mileageIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },

  mileageValue: {
    color: colors.primary,
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    marginTop: 3,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },

  infoValue: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: '600',
    marginTop: 3,
  },

  errorText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },

  backButton: {
    alignSelf: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 10,
    marginTop: spacing.lg,
  },

  backButtonText: {
    color: colors.background,
    fontWeight: '700',
  },
});
