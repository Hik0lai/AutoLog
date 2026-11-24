
import { useCallback, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import colors from '../constants/colors';
import spacing from '../constants/spacing';
import typography from '../constants/typography';

import { useAuth } from '../context/AuthContext';
import { getReminders } from '../services/reminderService';

const filters = [
  { label: 'Активни', value: 'active' },
  { label: 'Изпълнени', value: 'completed' },
  { label: 'Всички', value: 'all' },
];

const categoryIcons = {
  inspection: 'clipboard-outline',
  insurance: 'shield-checkmark-outline',
  casco: 'shield-outline',
  vignette: 'ticket-outline',
  oil: 'water-outline',
  timing_belt: 'construct-outline',
  other: 'notifications-outline',
};

const statusColors = {
  normal: '#22C55E',
  upcoming: '#F59E0B',
  overdue: '#EF4444',
  completed: '#64748B',
};

function getRemainingDays(dueDate) {
  if (!dueDate) return null;

  const [year, month, day] = dueDate
    .split('-')
    .map(Number);

  const now = new Date();

  const today = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const due = Date.UTC(year, month - 1, day);

  return Math.round(
    (due - today) / 86400000
  );
}

function getReminderStatus(reminder) {
  if (reminder.is_completed) {
    return {
      type: 'completed',
      label: 'Изпълнено',
      color: statusColors.completed,
    };
  }

  const remainingDays = getRemainingDays(
    reminder.due_date
  );

  const remainingKm =
    reminder.due_mileage != null &&
    reminder.vehicle?.mileage != null
      ? Number(reminder.due_mileage) -
        Number(reminder.vehicle.mileage)
      : null;

  const notifyDays = reminder.notify_days_before ?? 7;
  const notifyKm = reminder.notify_km_before ?? 500;

  const overdueMessages = [];
  const upcomingMessages = [];
  const normalMessages = [];

  if (remainingDays !== null) {
    if (remainingDays < 0) {
      overdueMessages.push(
        `Просрочено с ${Math.abs(remainingDays)} дни`
      );
    } else if (remainingDays === 0) {
      upcomingMessages.push('Крайният срок е днес');
    } else if (remainingDays <= notifyDays) {
      upcomingMessages.push(
        `Остават ${remainingDays} дни`
      );
    } else {
      normalMessages.push(
        `Остават ${remainingDays} дни`
      );
    }
  }

  if (remainingKm !== null) {
    if (remainingKm < 0) {
      overdueMessages.push(
        `Просрочено с ${Math.abs(remainingKm).toLocaleString('bg-BG')} км`
      );
    } else if (remainingKm === 0) {
      upcomingMessages.push(
        'Достигнат е крайният километраж'
      );
    } else if (remainingKm <= notifyKm) {
      upcomingMessages.push(
        `Остават ${remainingKm.toLocaleString('bg-BG')} км`
      );
    } else {
      normalMessages.push(
        `Остават ${remainingKm.toLocaleString('bg-BG')} км`
      );
    }
  }

  if (overdueMessages.length > 0) {
    return {
      type: 'overdue',
      label: overdueMessages.join(' • '),
      color: statusColors.overdue,
    };
  }

  if (upcomingMessages.length > 0) {
    return {
      type: 'upcoming',
      label: upcomingMessages.join(' • '),
      color: statusColors.upcoming,
    };
  }

  return {
    type: 'normal',
    label: normalMessages.join(' • ') || 'Активно',
    color: statusColors.normal,
  };
}

function formatDate(date) {
  if (!date) return null;

  const [year, month, day] = date.split('-');

  return `${day}.${month}.${year}`;
}

function formatMileage(mileage) {
  return `${Number(mileage).toLocaleString('bg-BG')} км`;
}

export default function RemindersScreen({ navigation }) {
  const { user } = useAuth();

  const [reminders, setReminders] = useState([]);
  const [filter, setFilter] = useState('active');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadReminders = useCallback(
    async (isRefreshing = false) => {
      if (!user?.id) {
        setReminders([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        setError('');

        if (isRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await getReminders(user.id);

        setReminders(data || []);
      } catch (error) {
        console.error(
          'Грешка при зареждане на напомнянията:',
          error
        );

        setError(
          'Напомнянията не могат да бъдат заредени.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.id]
  );

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders])
  );

  const activeReminders = reminders.filter(
    reminder => !reminder.is_completed
  );

  const upcomingCount = activeReminders.filter(
    reminder =>
      getReminderStatus(reminder).type === 'upcoming'
  ).length;

  const overdueCount = activeReminders.filter(
    reminder =>
      getReminderStatus(reminder).type === 'overdue'
  ).length;

  const filteredReminders = reminders.filter(
    reminder => {
      if (filter === 'active') {
        return !reminder.is_completed;
      }

      if (filter === 'completed') {
        return reminder.is_completed;
      }

      return true;
    }
  );

  const statusPriority = {
    overdue: 0,
    upcoming: 1,
    normal: 2,
    completed: 3,
  };

  const sortedReminders = [...filteredReminders].sort(
    (first, second) =>
      statusPriority[getReminderStatus(first).type] -
      statusPriority[getReminderStatus(second).type]
  );

  const handleAddReminder = () => {
    navigation.navigate('ReminderForm');
  };

  const openReminder = reminder => {
    navigation.navigate('ReminderDetails', {
      reminderId: reminder.id,
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
          onRefresh={() => loadReminders(true)}
          colors={[colors.primary]}
          tintColor={colors.primary}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.subtitle}>
            МОЯТ AUTOLOG
          </Text>

          <Text style={styles.title}>
            Напомняния
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="notifications-outline"
            size={27}
            color={colors.primary}
          />
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <StatCard
          label="Активни"
          value={activeReminders.length}
          color={colors.primary}
        />

        <StatCard
          label="Предстоящи"
          value={upcomingCount}
          color={statusColors.upcoming}
        />

        <StatCard
          label="Просрочени"
          value={overdueCount}
          color={statusColors.overdue}
        />
      </View>

      {/* Add reminder */}
      <TouchableOpacity
        style={styles.addButton}
        activeOpacity={0.85}
        onPress={handleAddReminder}
      >
        <Ionicons
          name="add-circle-outline"
          size={24}
          color={colors.background}
        />

        <Text style={styles.addButtonText}>
          Добави напомняне
        </Text>
      </TouchableOpacity>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {filters.map(item => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.filterButton,
              filter === item.value &&
                styles.filterButtonActive,
            ]}
            onPress={() => setFilter(item.value)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterText,
                filter === item.value &&
                  styles.filterTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reminder list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Зареждане на напомнянията...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={52}
            color={colors.danger}
          />

          <Text style={styles.emptyTitle}>
            Възникна грешка
          </Text>

          <Text style={styles.emptyDescription}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadReminders()}
          >
            <Text style={styles.retryButtonText}>
              Опитай отново
            </Text>
          </TouchableOpacity>
        </View>
      ) : sortedReminders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="notifications-off-outline"
              size={48}
              color={colors.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>
            {filter === 'completed'
              ? 'Няма изпълнени напомняния'
              : filter === 'active'
                ? 'Няма активни напомняния'
                : 'Все още няма напомняния'}
          </Text>

          <Text style={styles.emptyDescription}>
            {filter === 'completed'
              ? 'Изпълнените напомняния ще се показват тук.'
              : 'Добави напомняне, за да следиш предстоящите обслужвания и документи на своите автомобили.'}
          </Text>
        </View>
      ) : (
        sortedReminders.map(reminder => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            onPress={() => openReminder(reminder)}
          />
        ))
      )}
    </ScrollView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={styles.statCard}>
      <Text
        style={[
          styles.statValue,
          { color },
        ]}
      >
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function ReminderCard({ reminder, onPress }) {
  const status = getReminderStatus(reminder);

  const icon =
    categoryIcons[reminder.category] ||
    'notifications-outline';

  const vehicleName = reminder.vehicle
    ? `${reminder.vehicle.brand} ${reminder.vehicle.model}`
    : 'Автомобил';

  return (
    <TouchableOpacity
      style={styles.reminderCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.reminderHeader}>
        <View style={styles.reminderIcon}>
          <Ionicons
            name={icon}
            size={25}
            color={status.color}
          />
        </View>

        <View style={styles.reminderContent}>
          <Text
            style={styles.reminderTitle}
            numberOfLines={2}
          >
            {reminder.title}
          </Text>

          <Text style={styles.vehicleName}>
            {vehicleName}
          </Text>

          {reminder.vehicle?.registration_number ? (
            <Text style={styles.registrationNumber}>
              {reminder.vehicle.registration_number}
            </Text>
          ) : null}
        </View>

        <Ionicons
          name="chevron-forward"
          size={21}
          color={colors.textSecondary}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.dueContainer}>
        {reminder.due_date ? (
          <View style={styles.dueItem}>
            <Ionicons
              name="calendar-outline"
              size={17}
              color={colors.textSecondary}
            />

            <Text style={styles.dueText}>
              {formatDate(reminder.due_date)}
            </Text>
          </View>
        ) : null}

        {reminder.due_mileage != null ? (
          <View style={styles.dueItem}>
            <Ionicons
              name="speedometer-outline"
              size={17}
              color={colors.textSecondary}
            />

            <Text style={styles.dueText}>
              {formatMileage(reminder.due_mileage)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: status.color },
          ]}
        />

        <Text
          style={[
            styles.statusText,
            { color: status.color },
          ]}
        >
          {status.label}
        </Text>

        {reminder.notifications_enabled &&
          !reminder.is_completed && (
            <Ionicons
              name="notifications-outline"
              size={17}
              color={colors.textSecondary}
            />
          )}
      </View>
    </TouchableOpacity>
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

  headerText: {
    flex: 1,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },

  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: '700',
  },

  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },

  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    textAlign: 'center',
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },

  addButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },

  filtersContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  filterButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
  },

  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },

  filterTextActive: {
    color: colors.background,
    fontWeight: '700',
  },

  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: spacing.md,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },

  emptyContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 40,
  },

  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
    marginTop: spacing.md,
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.sm,
  },

  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },

  retryButtonText: {
    color: colors.background,
    fontWeight: '700',
  },

  reminderCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  reminderIcon: {
    width: 50,
    height: 50,
    borderRadius: 13,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  reminderContent: {
    flex: 1,
    marginRight: spacing.sm,
  },

  reminderTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },

  vehicleName: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },

  registrationNumber: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  dueContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },

  dueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  dueText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
});
