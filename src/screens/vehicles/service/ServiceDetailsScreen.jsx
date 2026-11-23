
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import colors from '../../../constants/colors';
import spacing from '../../../constants/spacing';
import typography from '../../../constants/typography';

function formatDate(date) {
  if (!date) return 'Не е посочена';

  const parts = date.split('-');

  if (parts.length !== 3) return date;

  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function formatMileage(mileage) {
  return `${Number(mileage || 0).toLocaleString('bg-BG')} км`;
}

function formatCost(cost) {
  return `${Number(cost || 0).toFixed(2)} лв.`;
}

function DetailRow({ icon, label, value, isLast = false }) {
  return (
    <View
      style={[
        styles.detailRow,
        !isLast && styles.detailRowBorder,
      ]}
    >
      <View style={styles.detailIcon}>
        <Ionicons
          name={icon}
          size={22}
          color={colors.primary}
        />
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>
          {value !== null && value !== undefined && value !== ''
            ? String(value)
            : 'Не е посочено'}
        </Text>
      </View>
    </View>
  );
}

export default function ServiceDetailsScreen({ route, navigation }) {
  const record = route.params?.record;
  const vehicle = route.params?.vehicle;

  if (!record) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Сервизният запис не е намерен.
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
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Детайли за обслужването
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons
            name="construct-outline"
            size={44}
            color={colors.primary}
          />
        </View>

        <Text style={styles.serviceTitle}>
          {record.title}
        </Text>

        <Text style={styles.serviceDate}>
          {formatDate(record.service_date)}
        </Text>

        {vehicle && (
          <Text style={styles.vehicleName}>
            {vehicle.brand} {vehicle.model}
          </Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>
        Информация за обслужването
      </Text>

      <View style={styles.detailsCard}>
        <DetailRow
          icon="calendar-outline"
          label="Дата"
          value={formatDate(record.service_date)}
        />

        <DetailRow
          icon="speedometer-outline"
          label="Пробег"
          value={formatMileage(record.mileage)}
        />

        <DetailRow
          icon="cash-outline"
          label="Стойност"
          value={formatCost(record.cost)}
        />

        <DetailRow
          icon="business-outline"
          label="Сервиз"
          value={record.workshop}
          isLast
        />
      </View>

      <Text style={styles.sectionTitle}>
        Описание
      </Text>

      <View style={styles.descriptionCard}>
        <Text style={styles.descriptionText}>
          {record.description || 'Няма добавено описание.'}
        </Text>
      </View>

      {record.notes ? (
        <>
          <Text style={styles.sectionTitle}>
            Бележки
          </Text>

          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>
              {record.notes}
            </Text>
          </View>
        </>
      ) : null}
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
    fontSize: typography.sizes.md,
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

  heroIcon: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  serviceTitle: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    textAlign: 'center',
  },

  serviceDate: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    marginTop: spacing.sm,
  },

  vehicleName: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },

  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailContent: {
    flex: 1,
  },

  detailLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },

  detailValue: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: '600',
    marginTop: spacing.xs,
  },

  descriptionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  descriptionText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    lineHeight: 23,
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
