
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import colors from '../../../constants/colors';
import spacing from '../../../constants/spacing';
import typography from '../../../constants/typography';

import { getServiceRecords } from '../../../services/serviceRecordService';

const SERVICE_ICONS = {
  oil: 'water-outline',
  timing: 'settings-outline',
  brakes: 'disc-outline',
  suspension: 'build-outline',
  tires: 'ellipse-outline',
  repair: 'construct-outline',
  other: 'document-text-outline',
};

function formatDate(date) {
  if (!date) return 'Няма дата';

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

export default function ServiceHistoryScreen({ route, navigation }) {
  const vehicle = route.params?.vehicle;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadRecords() {
        if (!vehicle?.id) {
          if (active) {
            setError('Не е избран автомобил.');
            setLoading(false);
          }
          return;
        }

        try {
          setLoading(true);
          setError('');

          const data = await getServiceRecords(vehicle.id);

          if (active) {
            setRecords(data);
          }
        } catch (err) {
          console.error('Service history load error:', err);

          if (active) {
            setError(
              err?.message || 'Неуспешно зареждане на обслужванията.'
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      loadRecords();

      return () => {
        active = false;
      };
    }, [vehicle?.id])
  );

  const handleRefresh = async () => {
    if (!vehicle?.id || refreshing) return;

    try {
      setRefreshing(true);
      setError('');

      const data = await getServiceRecords(vehicle.id);

      setRecords(data);
    } catch (err) {
      setError(err?.message || 'Грешка при обновяване.');
    } finally {
      setRefreshing(false);
    }
  };

  const openServiceDetails = (record) => {
    navigation.navigate('ServiceDetails', {
      record,
      vehicle,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
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
          <Text style={styles.countText}>
            {records.length}
          </Text>
        </View>
      </View>

      {/* Loading */}
      {loading ? (
        <View style={styles.statusContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.statusText}>
            Зареждане на обслужванията...
          </Text>
        </View>
      ) : error ? (
        /* Error */
        <View style={styles.statusContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color={colors.primary}
          />

          <Text style={styles.statusText}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryText}>
              Опитай отново
            </Text>
          </TouchableOpacity>
        </View>
      ) : records.length === 0 ? (
        /* Empty state */
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
      ) : (
        /* Service records */
        records.map((record) => (
          <TouchableOpacity
            key={record.id}
            style={styles.recordCard}
            activeOpacity={0.8}
            onPress={() => openServiceDetails(record)}
          >
            <View style={styles.recordHeader}>
              <View style={styles.recordIcon}>
                <Ionicons
                  name={
                    SERVICE_ICONS[record.category] ||
                    'construct-outline'
                  }
                  size={24}
                  color={colors.primary}
                />
              </View>

              <View style={styles.recordHeading}>
                <Text style={styles.recordTitle}>
                  {record.title}
                </Text>

                <Text style={styles.recordDate}>
                  {formatDate(record.service_date)}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </View>

            <View style={styles.recordDetails}>
              <View style={styles.detailRow}>
                <Ionicons
                  name="speedometer-outline"
                  size={18}
                  color={colors.textSecondary}
                />

                <Text style={styles.detailText}>
                  {formatMileage(record.mileage)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={colors.textSecondary}
                />

                <Text style={styles.detailText}>
                  {formatCost(record.cost)}
                </Text>
              </View>
            </View>

            {record.description ? (
              <Text style={styles.recordDescription}>
                {record.description}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))
      )}

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

  statusContainer: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  statusText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  retryButton: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },

  retryText: {
    color: colors.primary,
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

  recordCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  recordIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  recordHeading: {
    flex: 1,
  },

  recordTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },

  recordDate: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },

  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  detailText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
  },

  recordDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    marginTop: spacing.md,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },

  addButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
});
