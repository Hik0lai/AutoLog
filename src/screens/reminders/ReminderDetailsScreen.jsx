
import { useCallback, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import typography from '../../constants/typography';

import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/common/CustomAlert';

import {
  getReminderById,
  setReminderCompleted,
  deleteReminder,
} from '../../services/reminderService';

const categories = {
  inspection: {
    label: 'Годишен технически преглед',
    icon: 'clipboard-outline',
  },
  insurance: {
    label: 'Гражданска отговорност',
    icon: 'shield-checkmark-outline',
  },
  casco: {
    label: 'Каско',
    icon: 'shield-outline',
  },
  vignette: {
    label: 'Винетка',
    icon: 'ticket-outline',
  },
  oil: {
    label: 'Смяна на масло и филтри',
    icon: 'water-outline',
  },
  timing_belt: {
    label: 'Смяна на ангренажен ремък',
    icon: 'construct-outline',
  },
  other: {
    label: 'Друго',
    icon: 'notifications-outline',
  },
};

const statusColors = {
  normal: '#22C55E',
  upcoming: '#F59E0B',
  overdue: '#EF4444',
  completed: '#64748B',
};

function formatDate(date) {
  if (!date) return '—';

  const [year, month, day] = date
    .slice(0, 10)
    .split('-');

  return `${day}.${month}.${year}`;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '—';

  return new Date(timestamp).toLocaleDateString('bg-BG');
}

function formatMileage(mileage) {
  if (mileage == null) return '—';

  return `${Number(mileage).toLocaleString('bg-BG')} км`;
}

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

  return Math.round((due - today) / 86400000);
}

function getRemainingMileage(reminder) {
  if (
    reminder.due_mileage == null ||
    reminder.vehicle?.mileage == null
  ) {
    return null;
  }

  return (
    Number(reminder.due_mileage) -
    Number(reminder.vehicle.mileage)
  );
}

function getReminderStatus(reminder) {
  if (reminder.is_completed) {
    return {
      label: 'Изпълнено',
      color: statusColors.completed,
      icon: 'checkmark-circle-outline',
    };
  }

  const days = getRemainingDays(reminder.due_date);
  const km = getRemainingMileage(reminder);

  if (
    (days !== null && days < 0) ||
    (km !== null && km < 0)
  ) {
    return {
      label: 'Просрочено',
      color: statusColors.overdue,
      icon: 'alert-circle-outline',
    };
  }

  if (
    (days !== null &&
      days <= (reminder.notify_days_before ?? 7)) ||
    (km !== null &&
      km <= (reminder.notify_km_before ?? 500))
  ) {
    return {
      label: 'Предстоящо',
      color: statusColors.upcoming,
      icon: 'time-outline',
    };
  }

  return {
    label: 'Активно',
    color: statusColors.normal,
    icon: 'checkmark-circle-outline',
  };
}

function getDaysMessage(days) {
  if (days === null) return '—';

  if (days < 0) {
    return `Просрочено с ${Math.abs(days)} дни`;
  }

  if (days === 0) {
    return 'Крайният срок е днес';
  }

  if (days === 1) {
    return 'Остава 1 ден';
  }

  return `Остават ${days} дни`;
}

function getMileageMessage(km) {
  if (km === null) return '—';

  if (km < 0) {
    return `Просрочено с ${formatMileage(Math.abs(km))}`;
  }

  if (km === 0) {
    return 'Достигнат краен километраж';
  }

  return `Остават ${formatMileage(km)}`;
}

export default function ReminderDetailsScreen({
  navigation,
  route,
}) {
  const { user } = useAuth();

  const reminderId = route.params?.reminderId;

  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Разбрах',
    cancelText: undefined,
    onConfirm: null,
  });

  const hideAlert = () => {
    setAlert(current => ({
      ...current,
      visible: false,
    }));
  };

  const showAlert = ({
    title,
    message,
    type = 'info',
    confirmText = 'Разбрах',
    cancelText,
    onConfirm = null,
  }) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  const loadReminder = useCallback(async () => {
    if (!user?.id || !reminderId) {
      setError('Напомнянето не е намерено.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await getReminderById(
        reminderId,
        user.id
      );

      setReminder(data);
    } catch (error) {
      console.error('Load reminder error:', error);

      setReminder(null);
      setError(
        'Информацията за напомнянето не може да бъде заредена.'
      );
    } finally {
      setLoading(false);
    }
  }, [reminderId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadReminder();
    }, [loadReminder])
  );

  const handleEdit = () => {
    if (!reminder || processing) return;

    navigation.navigate('ReminderForm', {
      reminder,
    });
  };

  const changeCompletedStatus = async () => {
    if (!reminder || !user?.id || processing) {
      return;
    }

    const nextStatus = !reminder.is_completed;

    try {
      setProcessing(true);

      const updatedReminder =
        await setReminderCompleted(
          reminder.id,
          nextStatus,
          user.id
        );

      setReminder(current => ({
        ...current,
        ...updatedReminder,
      }));

      showAlert({
        title: 'Успешна промяна',
        message: nextStatus
          ? 'Напомнянето беше маркирано като изпълнено.'
          : 'Напомнянето беше активирано отново.',
        type: 'success',
      });
    } catch (error) {
      console.error(
        'Change reminder status error:',
        error
      );

      showAlert({
        title: 'Грешка',
        message:
          'Състоянието на напомнянето не можа да бъде променено.',
        type: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleChangeStatus = () => {
    if (!reminder || processing) return;

    if (reminder.is_completed) {
      showAlert({
        title: 'Повторно активиране',
        message:
          'Искаш ли да активираш напомнянето отново? Съществуващите крайни срокове ще бъдат запазени.',
        type: 'info',
        confirmText: 'Активирай',
        cancelText: 'Отказ',
        onConfirm: changeCompletedStatus,
      });
    } else {
      showAlert({
        title: 'Изпълнено напомняне',
        message:
          'Сигурен ли си, че искаш да маркираш това напомняне като изпълнено?',
        type: 'info',
        confirmText: 'Потвърди',
        cancelText: 'Отказ',
        onConfirm: changeCompletedStatus,
      });
    }
  };

  const performDelete = async () => {
    if (!reminder || !user?.id || processing) {
      return;
    }

    try {
      setProcessing(true);

      await deleteReminder(
        reminder.id,
        user.id
      );

      showAlert({
        title: 'Успешно изтриване',
        message:
          'Напомнянето беше изтрито успешно.',
        type: 'success',
        onConfirm: () => navigation.goBack(),
      });
    } catch (error) {
      console.error('Delete reminder error:', error);

      showAlert({
        title: 'Грешка при изтриване',
        message:
          'Напомнянето не можа да бъде изтрито.',
        type: 'error',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = () => {
    if (!reminder || processing) return;

    showAlert({
      title: 'Изтриване на напомняне',
      message:
        `Сигурен ли си, че искаш да изтриеш "${reminder.title}"? Това действие е необратимо.`,
      type: 'warning',
      confirmText: 'Изтрий',
      cancelText: 'Отказ',
      onConfirm: performDelete,
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Зареждане на напомнянето...
        </Text>
      </View>
    );
  }

  if (error || !reminder) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={56}
          color={colors.danger}
        />

        <Text style={styles.errorText}>
          {error || 'Напомнянето не е намерено.'}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadReminder}
        >
          <Text style={styles.primaryButtonText}>
            Опитай отново
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>
            Назад
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const category =
    categories[reminder.category] ||
    categories.other;

  const status = getReminderStatus(reminder);

  const remainingDays = getRemainingDays(
    reminder.due_date
  );

  const remainingKm = getRemainingMileage(reminder);

  const vehicleName = reminder.vehicle
    ? `${reminder.vehicle.brand} ${reminder.vehicle.model}`
    : 'Автомобил';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={processing}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.subtitle}>
              МОЯТ AUTOLOG
            </Text>

            <Text style={styles.title}>
              Детайли на напомнянето
            </Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.categoryIcon}>
            <Ionicons
              name={category.icon}
              size={38}
              color={status.color}
            />
          </View>

          <Text style={styles.reminderTitle}>
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

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${status.color}20`,
                borderColor: `${status.color}50`,
              },
            ]}
          >
            <Ionicons
              name={status.icon}
              size={19}
              color={status.color}
            />

            <Text
              style={[
                styles.statusText,
                { color: status.color },
              ]}
            >
              {status.label}
            </Text>
          </View>
        </View>

        {/* General information */}
        <Text style={styles.sectionTitle}>
          Информация
        </Text>

        <View style={styles.infoCard}>
          <InfoRow
            icon="car-sport-outline"
            label="Автомобил"
            value={vehicleName}
          />

          <InfoRow
            icon="pricetag-outline"
            label="Категория"
            value={category.label}
          />

          <InfoRow
            icon="calendar-outline"
            label="Създадено на"
            value={formatTimestamp(reminder.created_at)}
            last
          />
        </View>

        {/* Deadlines */}
        <Text style={styles.sectionTitle}>
          Крайни срокове
        </Text>

        {reminder.due_date && (
          <View style={styles.deadlineCard}>
            <View style={styles.deadlineHeader}>
              <Ionicons
                name="calendar-outline"
                size={24}
                color={colors.primary}
              />

              <Text style={styles.deadlineLabel}>
                По дата
              </Text>
            </View>

            <Text style={styles.deadlineValue}>
              {formatDate(reminder.due_date)}
            </Text>

            {!reminder.is_completed && (
              <Text
                style={[
                  styles.deadlineMessage,
                  {
                    color:
                      remainingDays < 0
                        ? statusColors.overdue
                        : remainingDays <=
                            (reminder.notify_days_before ?? 7)
                          ? statusColors.upcoming
                          : statusColors.normal,
                  },
                ]}
              >
                {getDaysMessage(remainingDays)}
              </Text>
            )}
          </View>
        )}

        {reminder.due_mileage != null && (
          <View style={styles.deadlineCard}>
            <View style={styles.deadlineHeader}>
              <Ionicons
                name="speedometer-outline"
                size={24}
                color={colors.primary}
              />

              <Text style={styles.deadlineLabel}>
                По километраж
              </Text>
            </View>

            <Text style={styles.deadlineValue}>
              {formatMileage(reminder.due_mileage)}
            </Text>

            <Text style={styles.helperText}>
              Текущ километраж:{' '}
              {formatMileage(reminder.vehicle?.mileage)}
            </Text>

            {!reminder.is_completed &&
              remainingKm !== null && (
                <Text
                  style={[
                    styles.deadlineMessage,
                    {
                      color:
                        remainingKm < 0
                          ? statusColors.overdue
                          : remainingKm <=
                              (reminder.notify_km_before ?? 500)
                            ? statusColors.upcoming
                            : statusColors.normal,
                    },
                  ]}
                >
                  {getMileageMessage(remainingKm)}
                </Text>
              )}
          </View>
        )}

        {/* Notification settings */}
        <Text style={styles.sectionTitle}>
          Настройки за известяване
        </Text>

        <View style={styles.infoCard}>
          <InfoRow
            icon="notifications-outline"
            label="Известия"
            value={
              reminder.notifications_enabled
                ? 'Включени'
                : 'Изключени'
            }
            valueColor={
              reminder.notifications_enabled
                ? statusColors.normal
                : colors.textSecondary
            }
            last={!reminder.notifications_enabled}
          />

          {reminder.notifications_enabled && (
            <>
              {reminder.due_date && (
                <InfoRow
                  icon="calendar-outline"
                  label="Предупреждение по дата"
                  value={`${reminder.notify_days_before ?? 7} дни по-рано`}
                  last={reminder.due_mileage == null}
                />
              )}

              {reminder.due_mileage != null && (
                <InfoRow
                  icon="speedometer-outline"
                  label="Предупреждение по километраж"
                  value={`${formatMileage(reminder.notify_km_before ?? 500)} по-рано`}
                  last
                />
              )}
            </>
          )}
        </View>

        {/* Completion information */}
        {reminder.is_completed && (
          <>
            <Text style={styles.sectionTitle}>
              Изпълнение
            </Text>

            <View style={styles.infoCard}>
              <InfoRow
                icon="checkmark-circle-outline"
                label="Изпълнено на"
                value={formatTimestamp(
                  reminder.completed_at
                )}
                last
              />
            </View>
          </>
        )}

        {/* Notes */}
        <Text style={styles.sectionTitle}>
          Допълнителни бележки
        </Text>

        <View style={styles.notesCard}>
          <Text
            style={[
              styles.notesText,
              !reminder.description &&
                styles.emptyNotes,
            ]}
          >
            {reminder.description ||
              'Няма добавени бележки.'}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: reminder.is_completed
                  ? colors.surfaceElevated
                  : '#16A34A',
              },
              processing && styles.disabledButton,
            ]}
            onPress={handleChangeStatus}
            disabled={processing}
            activeOpacity={0.85}
          >
            <Ionicons
              name={
                reminder.is_completed
                  ? 'refresh-outline'
                  : 'checkmark-circle-outline'
              }
              size={24}
              color="#FFFFFF"
            />

            <Text style={styles.actionButtonText}>
              {reminder.is_completed
                ? 'Активирай отново'
                : 'Маркирай като изпълнено'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.primary },
              processing && styles.disabledButton,
            ]}
            onPress={handleEdit}
            disabled={processing}
            activeOpacity={0.85}
          >
            <Ionicons
              name="create-outline"
              size={24}
              color={colors.background}
            />

            <Text style={styles.primaryButtonText}>
              Редактирай напомнянето
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              processing && styles.disabledButton,
            ]}
            onPress={handleDelete}
            disabled={processing}
            activeOpacity={0.85}
          >
            <Ionicons
              name="trash-outline"
              size={23}
              color={colors.danger}
            />

            <Text style={styles.deleteButtonText}>
              Изтрий напомнянето
            </Text>
          </TouchableOpacity>

          {processing && (
            <ActivityIndicator
              color={colors.primary}
              style={styles.processingIndicator}
            />
          )}
        </View>
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onCancel={hideAlert}
        onConfirm={() => {
          const action = alert.onConfirm;

          hideAlert();

          if (action) action();
        }}
      />
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  valueColor,
  last = false,
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && styles.infoRowBorder,
      ]}
    >
      <Ionicons
        name={icon}
        size={21}
        color={colors.primary}
      />

      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.infoValue,
          valueColor && { color: valueColor },
        ]}
      >
        {value}
      </Text>
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

  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },

  errorText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: 23,
  },

  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },

  secondaryButton: {
    padding: spacing.md,
  },

  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },

  backButton: {
    width: 46,
    height: 46,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  headerContent: {
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

  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },

  categoryIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  reminderTitle: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    textAlign: 'center',
  },

  vehicleName: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: spacing.sm,
    textAlign: 'center',
  },

  registrationNumber: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },

  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  infoLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },

  infoValue: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    textAlign: 'right',
  },

  deadlineCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },

  deadlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  deadlineLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },

  deadlineValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    marginTop: spacing.md,
  },

  deadlineMessage: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    marginTop: spacing.sm,
  },

  helperText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
  },

  notesCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    minHeight: 75,
  },

  notesText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    lineHeight: 23,
  },

  emptyNotes: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  actionsContainer: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    minHeight: 55,
  },

  actionButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },

  primaryButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    minHeight: 55,
  },

  deleteButtonText: {
    color: colors.danger,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.5,
  },

  processingIndicator: {
    marginTop: spacing.sm,
  },
});
