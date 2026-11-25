
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

import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/common/CustomAlert';

import {
  getExpenseById,
  deleteExpense,
} from '../../services/expenseService';

const CATEGORIES = {
  fuel: {
    label: 'Гориво',
    icon: 'speedometer-outline',
    color: '#3B82F6',
  },
  repairs: {
    label: 'Ремонти и обслужване',
    icon: 'construct-outline',
    color: '#F59E0B',
  },
  consumables: {
    label: 'Консумативи',
    icon: 'settings-outline',
    color: '#A855F7',
  },
  insurance: {
    label: 'Застраховки',
    icon: 'shield-checkmark-outline',
    color: '#22C55E',
  },
  fees: {
    label: 'Данъци и такси',
    icon: 'receipt-outline',
    color: '#06B6D4',
  },
  vignette: {
    label: 'Винетки',
    icon: 'ticket-outline',
    color: '#EAB308',
  },
  inspection: {
    label: 'Технически преглед',
    icon: 'clipboard-outline',
    color: '#14B8A6',
  },
  parking: {
    label: 'Паркинг',
    icon: 'car-outline',
    color: '#6366F1',
  },
  car_wash: {
    label: 'Автомивка',
    icon: 'water-outline',
    color: '#0EA5E9',
  },
  other: {
    label: 'Други',
    icon: 'ellipsis-horizontal-outline',
    color: '#94A3B8',
  },
};

const FUELS = {
  petrol: { label: 'Бензин', unit: 'л' },
  diesel: { label: 'Дизел', unit: 'л' },
  lpg: { label: 'Газ (LPG)', unit: 'л' },
  cng: { label: 'Метан (CNG)', unit: 'кг' },
  electric: {
    label: 'Електричество',
    unit: 'kWh',
  },
};

function formatMoney(value) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatNumber(value, digits = 3) {
  return Number(value).toLocaleString('bg-BG', {
    maximumFractionDigits: digits,
  });
}

function formatDate(value) {
  if (!value) return '—';

  const [year, month, day] = value.split('-');

  return `${day}.${month}.${year} г.`;
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value ?? '—'}
      </Text>
    </View>
  );
}

export default function ExpenseDetailsScreen({
  route,
  navigation,
}) {
  const { user } = useAuth();

  const expenseId = route.params?.expenseId;

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

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
    setAlert((current) => ({
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
    onConfirm,
  }) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm: onConfirm || hideAlert,
    });
  };

  const loadExpense = useCallback(async () => {
    if (!user?.id || !expenseId) {
      setExpense(null);
      setError('Разходът не е намерен.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getExpenseById(
        expenseId,
        user.id
      );

      if (!data) {
        setExpense(null);
        setError('Разходът не е намерен.');
        return;
      }

      setExpense(data);
    } catch (err) {
      console.error('Load expense error:', err);

      setExpense(null);
      setError(
        'Информацията за разхода не можа да бъде заредена.'
      );
    } finally {
      setLoading(false);
    }
  }, [expenseId, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadExpense();
    }, [loadExpense])
  );

  const handleEdit = () => {
    if (!expense || deleting) return;

    navigation.navigate('ExpenseForm', {
      expense,
    });
  };

  const handleDelete = async () => {
    if (!expense || !user?.id || deleting) return;

    hideAlert();

    try {
      setDeleting(true);

      await deleteExpense(expense.id, user.id);

      showAlert({
        title: 'Успешно изтриване',
        message: 'Разходът беше изтрит успешно.',
        type: 'success',
        onConfirm: () => {
          hideAlert();
          navigation.goBack();
        },
      });
    } catch (err) {
      console.error('Delete expense error:', err);

      showAlert({
        title: 'Грешка',
        message: 'Разходът не можа да бъде изтрит.',
        type: 'error',
      });

      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (deleting) return;

    showAlert({
      title: 'Изтриване на разход',
      message:
        'Сигурен ли си, че искаш да изтриеш този разход? Действието е необратимо.',
      type: 'warning',
      confirmText: 'Изтрий',
      cancelText: 'Отказ',
      onConfirm: handleDelete,
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.secondaryText}>
          Зареждане на разхода...
        </Text>
      </View>
    );
  }

  if (error || !expense) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={52}
          color={colors.danger}
        />

        <Text style={styles.errorText}>
          {error || 'Разходът не е намерен.'}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={loadExpense}
        >
          <Text style={styles.buttonText}>
            Опитай отново
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>
            Назад
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const category =
    CATEGORIES[expense.category] ||
    CATEGORIES.other;

  const vehicle = expense.vehicle;

  const isFuel = expense.category === 'fuel';

  const fuel = FUELS[expense.fuel_type] || {
    label: expense.fuel_type || '—',
    unit: 'л',
  };

  const vehicleName = vehicle
    ? `${vehicle.brand} ${vehicle.model}`
    : 'Автомобил';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={deleting}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.subtitle}>
              МОЯТ AUTOLOG
            </Text>

            <Text style={styles.title}>
              Детайли на разхода
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View
            style={[
              styles.categoryIcon,
              {
                backgroundColor:
                  `${category.color}20`,
              },
            ]}
          >
            <Ionicons
              name={category.icon}
              size={36}
              color={category.color}
            />
          </View>

          <Text style={styles.categoryTitle}>
            {category.label}
          </Text>

          <Text style={styles.amount}>
            {formatMoney(expense.amount)}
          </Text>

          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.textSecondary}
            />

            <Text style={styles.secondaryText}>
              {formatDate(expense.expense_date)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Основна информация
          </Text>

          <InfoRow
            label="Автомобил"
            value={vehicleName}
          />

          <InfoRow
            label="Регистрационен номер"
            value={vehicle?.registration_number}
          />

          <InfoRow
            label="Категория"
            value={category.label}
          />

          <InfoRow
            label="Километраж"
            value={
              expense.mileage != null
                ? `${formatNumber(expense.mileage, 0)} км`
                : 'Не е въведен'
            }
          />
        </View>

        {isFuel && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Информация за зареждането
            </Text>

            <InfoRow
              label="Вид гориво"
              value={fuel.label}
            />

            <InfoRow
              label="Количество"
              value={
                expense.liters != null
                  ? `${formatNumber(expense.liters)} ${fuel.unit}`
                  : '—'
              }
            />

            <InfoRow
              label="Единична цена"
              value={
                expense.price_per_liter != null
                  ? `${formatNumber(expense.price_per_liter)} €/${fuel.unit}`
                  : '—'
              }
            />

            {expense.fuel_type !== 'electric' && (
              <View style={styles.tankRow}>
                <Ionicons
                  name={
                    expense.full_tank
                      ? 'checkmark-circle-outline'
                      : 'ellipse-outline'
                  }
                  size={22}
                  color={
                    expense.full_tank
                      ? '#22C55E'
                      : colors.textSecondary
                  }
                />

                <Text
                  style={[
                    styles.tankText,
                    expense.full_tank &&
                      styles.fullTankText,
                  ]}
                >
                  {expense.full_tank
                    ? 'Пълен резервоар'
                    : 'Частично зареждане'}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Описание
          </Text>

          <Text style={styles.description}>
            {expense.description ||
              'Няма добавено описание.'}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.editButton,
              deleting && styles.disabledButton,
            ]}
            onPress={handleEdit}
            disabled={deleting}
            activeOpacity={0.8}
          >
            <Ionicons
              name="create-outline"
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.buttonText}>
              Редактирай
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              deleting && styles.disabledButton,
            ]}
            onPress={confirmDelete}
            disabled={deleting}
            activeOpacity={0.8}
          >
            {deleting ? (
              <ActivityIndicator
                color={colors.danger}
              />
            ) : (
              <>
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={colors.danger}
                />

                <Text style={styles.deleteButtonText}>
                  Изтрий
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={alert.onConfirm || hideAlert}
        onCancel={hideAlert}
      />
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: spacing.xl,
  },

  headerText: {
    flex: 1,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  subtitle: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  title: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '700',
  },

  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.lg,
  },

  categoryIcon: {
    width: 76,
    height: 76,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoryTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },

  amount: {
    color: colors.primary,
    fontSize: 38,
    fontWeight: '800',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  secondaryText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: 16,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },

  infoLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
  },

  infoValue: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },

  tankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },

  tankText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  fullTankText: {
    color: '#22C55E',
  },

  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.sm,
  },

  editButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 54,
    padding: 12,
    gap: 8,
  },

  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 14,
    minHeight: 54,
    padding: 12,
    gap: 8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  deleteButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.5,
  },

  errorText: {
    color: colors.text,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },

  backText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
    padding: 8,
  },
});
