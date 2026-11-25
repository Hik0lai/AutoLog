
import { useCallback, useMemo, useState } from 'react';
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
import { getVehicles } from '../services/vehicleService';
import { getCombinedExpenses } from '../services/expenseService';

const CATEGORIES = [
  {
    value: 'fuel',
    label: 'Гориво',
    icon: 'speedometer-outline',
    color: '#3B82F6',
  },
  {
    value: 'repairs',
    label: 'Ремонти и обслужване',
    icon: 'construct-outline',
    color: '#F59E0B',
  },
  {
    value: 'consumables',
    label: 'Консумативи',
    icon: 'settings-outline',
    color: '#A855F7',
  },
  {
    value: 'insurance',
    label: 'Застраховки',
    icon: 'shield-checkmark-outline',
    color: '#22C55E',
  },
  {
    value: 'fees',
    label: 'Данъци и такси',
    icon: 'receipt-outline',
    color: '#06B6D4',
  },
  {
    value: 'vignette',
    label: 'Винетки',
    icon: 'ticket-outline',
    color: '#EAB308',
  },
  {
    value: 'inspection',
    label: 'Технически преглед',
    icon: 'clipboard-outline',
    color: '#14B8A6',
  },
  {
    value: 'parking',
    label: 'Паркинг',
    icon: 'car-outline',
    color: '#6366F1',
  },
  {
    value: 'car_wash',
    label: 'Автомивка',
    icon: 'water-outline',
    color: '#0EA5E9',
  },
  {
    value: 'other',
    label: 'Други',
    icon: 'ellipsis-horizontal-outline',
    color: '#94A3B8',
  },
];

const PERIODS = [
  { value: 'all', label: 'Всички периоди' },
  { value: 'month', label: 'Този месец' },
  { value: 'previous_month', label: 'Миналия месец' },
  { value: 'year', label: 'Тази година' },
];

const FUEL_TYPES = {
  petrol: {
    label: 'Бензин',
    unit: 'л',
  },
  diesel: {
    label: 'Дизел',
    unit: 'л',
  },
  lpg: {
    label: 'Газ (LPG)',
    unit: 'л',
  },
  cng: {
    label: 'Метан (CNG)',
    unit: 'кг',
  },
  electric: {
    label: 'Електричество',
    unit: 'kWh',
  },
};

function getCategory(category) {
  return (
    CATEGORIES.find((item) => item.value === category) ||
    CATEGORIES[CATEGORIES.length - 1]
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatNumber(value, digits = 2) {
  return Number(value || 0).toLocaleString('bg-BG', {
    maximumFractionDigits: digits,
  });
}

function formatDate(value) {
  if (!value) return '—';

  const [year, month, day] = value.split('-');

  return `${day}.${month}.${year}`;
}

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}

function matchesPeriod(expenseDate, period) {
  if (period === 'all') return true;
  if (!expenseDate) return false;

  const now = new Date();

  if (period === 'month') {
    return expenseDate.slice(0, 7) === getMonthKey(now);
  }

  if (period === 'previous_month') {
    const previousMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    return (
      expenseDate.slice(0, 7) ===
      getMonthKey(previousMonth)
    );
  }

  if (period === 'year') {
    return (
      expenseDate.slice(0, 4) ===
      String(now.getFullYear())
    );
  }

  return true;
}

function getExpenseTitle(expense) {
  if (expense.source === 'service') {
    return expense.title || 'Сервизно обслужване';
  }

  return getCategory(expense.category).label;
}

function FilterSelector({
  icon,
  label,
  options,
  value,
  expanded,
  onToggle,
  onSelect,
}) {
  const selectedOption = options.find(
    (option) => option.value === value
  );

  return (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <Ionicons
          name={icon}
          size={21}
          color={colors.primary}
        />

        <View style={styles.filterTextContainer}>
          <Text style={styles.filterLabel}>
            {label}
          </Text>

          <Text
            style={styles.filterValue}
            numberOfLines={1}
          >
            {selectedOption?.label || 'Избери'}
          </Text>
        </View>

        <Ionicons
          name={
            expanded
              ? 'chevron-up'
              : 'chevron-down'
          }
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.filterOptions}>
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  selected &&
                    styles.selectedFilterOption,
                ]}
                onPress={() => onSelect(option.value)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    selected &&
                      styles.selectedFilterOptionText,
                  ]}
                >
                  {option.label}
                </Text>

                {selected && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

function ExpenseCard({ expense, onPress }) {
  const category = getCategory(expense.category);
  const vehicle = expense.vehicle;

  const isService = expense.source === 'service';

  const Card = isService ? View : TouchableOpacity;

  const fuel = FUEL_TYPES[expense.fuel_type] || {
    label: expense.fuel_type,
    unit: 'л',
  };

  return (
    <Card
      style={styles.expenseCard}
      {...(!isService
        ? {
            onPress,
            activeOpacity: 0.8,
            accessibilityRole: 'button',
            accessibilityLabel: getExpenseTitle(expense),
          }
        : {})}
    >
      <View style={styles.expenseMainRow}>
        <View
          style={[
            styles.categoryIcon,
            {
              backgroundColor: `${category.color}20`,
            },
          ]}
        >
          <Ionicons
            name={category.icon}
            size={25}
            color={category.color}
          />
        </View>

        <View style={styles.expenseInfo}>
          <Text
            style={styles.expenseTitle}
            numberOfLines={2}
          >
            {getExpenseTitle(expense)}
          </Text>

          <Text style={styles.vehicleName}>
            {vehicle
              ? `${vehicle.brand} ${vehicle.model}`
              : 'Автомобил'}
          </Text>

          <Text style={styles.expenseDate}>
            {formatDate(expense.expense_date)}
          </Text>
        </View>

        <Text style={styles.expenseAmount}>
          {formatMoney(expense.amount)}
        </Text>

        {!isService && (
          <Ionicons
            name="chevron-forward"
            size={19}
            color={colors.textSecondary}
          />
        )}
      </View>

      {expense.category === 'fuel' && (
        <View style={styles.fuelInfo}>
          {expense.fuel_type && (
            <Text style={styles.fuelInfoText}>
              {fuel.label}
            </Text>
          )}

          {expense.liters != null && (
            <Text style={styles.fuelInfoText}>
              {formatNumber(expense.liters, 3)} {fuel.unit}
            </Text>
          )}

          {expense.price_per_liter != null && (
            <Text style={styles.fuelInfoText}>
              {formatNumber(
                expense.price_per_liter,
                3
              )} €/{fuel.unit}
            </Text>
          )}

          {expense.full_tank &&
            expense.fuel_type !== 'electric' && (
              <View style={styles.fullTankBadge}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={14}
                  color="#22C55E"
                />

                <Text style={styles.fullTankText}>
                  Пълен резервоар
                </Text>
              </View>
            )}
        </View>
      )}

      {expense.description ? (
        <Text
          style={styles.expenseDescription}
          numberOfLines={2}
        >
          {expense.description}
        </Text>
      ) : null}

      {isService && (
        <View style={styles.serviceBadge}>
          <Ionicons
            name="construct-outline"
            size={14}
            color="#F59E0B"
          />

          <Text style={styles.serviceBadgeText}>
            От сервизната история
          </Text>
        </View>
      )}
    </Card>
  );
}

export default function ExpensesScreen({ navigation }) {
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [vehicleFilter, setVehicleFilter] =
    useState('all');

  const [categoryFilter, setCategoryFilter] =
    useState('all');

  const [periodFilter, setPeriodFilter] =
    useState('all');

  const [expandedFilter, setExpandedFilter] =
    useState(null);

  const loadData = useCallback(
    async (isRefreshing = false) => {
      if (!user?.id) {
        setExpenses([]);
        setVehicles([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (isRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const [expenseData, vehicleData] =
          await Promise.all([
            getCombinedExpenses(user.id),
            getVehicles(user.id),
          ]);

        setExpenses(expenseData || []);
        setVehicles(vehicleData || []);

        setVehicleFilter((current) => {
          if (
            current !== 'all' &&
            !vehicleData?.some(
              (vehicle) => vehicle.id === current
            )
          ) {
            return 'all';
          }

          return current;
        });
      } catch (err) {
        console.error('Load expenses error:', err);

        setError(
          'Разходите не можаха да бъдат заредени.'
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
      loadData();
    }, [loadData])
  );

  const vehicleOptions = useMemo(
    () => [
      {
        value: 'all',
        label: 'Всички автомобили',
      },
      ...vehicles.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.brand} ${vehicle.model}${
          vehicle.registration_number
            ? ` (${vehicle.registration_number})`
            : ''
        }`,
      })),
    ],
    [vehicles]
  );

  const categoryOptions = [
    {
      value: 'all',
      label: 'Всички категории',
    },
    ...CATEGORIES,
  ];

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const vehicleMatches =
          vehicleFilter === 'all' ||
          expense.vehicle_id === vehicleFilter;

        const categoryMatches =
          categoryFilter === 'all' ||
          expense.category === categoryFilter;

        const periodMatches = matchesPeriod(
          expense.expense_date,
          periodFilter
        );

        return (
          vehicleMatches &&
          categoryMatches &&
          periodMatches
        );
      }),
    [
      expenses,
      vehicleFilter,
      categoryFilter,
      periodFilter,
    ]
  );

  const totalAmount = useMemo(
    () =>
      filteredExpenses.reduce(
        (sum, expense) =>
          sum + Number(expense.amount || 0),
        0
      ),
    [filteredExpenses]
  );

  const monthlyAmount = useMemo(
    () =>
      expenses
        .filter(
          (expense) =>
            matchesPeriod(
              expense.expense_date,
              'month'
            ) &&
            (
              vehicleFilter === 'all' ||
              expense.vehicle_id === vehicleFilter
            ) &&
            (
              categoryFilter === 'all' ||
              expense.category === categoryFilter
            )
        )
        .reduce(
          (sum, expense) =>
            sum + Number(expense.amount || 0),
          0
        ),
    [expenses, vehicleFilter, categoryFilter]
  );

  const hasFilters =
    vehicleFilter !== 'all' ||
    categoryFilter !== 'all' ||
    periodFilter !== 'all';

  const resetFilters = () => {
    setVehicleFilter('all');
    setCategoryFilter('all');
    setPeriodFilter('all');
    setExpandedFilter(null);
  };

  const toggleFilter = (filter) => {
    setExpandedFilter((current) =>
      current === filter ? null : filter
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.loadingText}>
          Зареждане на разходите...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={52}
          color={colors.danger}
        />

        <Text style={styles.errorText}>
          {error}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => loadData()}
        >
          <Text style={styles.primaryButtonText}>
            Опитай отново
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadData(true)}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>
            МОЯТ AUTOLOG
          </Text>

          <Text style={styles.title}>
            Разходи
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate('ExpenseForm')
          }
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Добави разход"
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color="#FFFFFF"
          />

          <Text style={styles.addButtonText}>
            Добави разход
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryLabel}>
            {hasFilters
              ? 'ФИЛТРИРАНИ РАЗХОДИ'
              : 'ОБЩО РАЗХОДИ'}
          </Text>

          <Ionicons
            name="stats-chart-outline"
            size={23}
            color={colors.primary}
          />
        </View>

        <Text style={styles.totalAmount}>
          {formatMoney(totalAmount)}
        </Text>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Text style={styles.statLabel}>
              Този месец
            </Text>

            <Text style={styles.statValue}>
              {formatMoney(monthlyAmount)}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.summaryStat}>
            <Text style={styles.statLabel}>
              Брой разходи
            </Text>

            <Text style={styles.statValue}>
              {filteredExpenses.length}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Филтри
        </Text>

        {hasFilters && (
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.resetText}>
              Изчисти
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FilterSelector
        icon="car-sport-outline"
        label="Автомобил"
        options={vehicleOptions}
        value={vehicleFilter}
        expanded={expandedFilter === 'vehicle'}
        onToggle={() => toggleFilter('vehicle')}
        onSelect={(value) => {
          setVehicleFilter(value);
          setExpandedFilter(null);
        }}
      />

      <FilterSelector
        icon="calendar-outline"
        label="Период"
        options={PERIODS}
        value={periodFilter}
        expanded={expandedFilter === 'period'}
        onToggle={() => toggleFilter('period')}
        onSelect={(value) => {
          setPeriodFilter(value);
          setExpandedFilter(null);
        }}
      />

      <FilterSelector
        icon="filter-outline"
        label="Категория"
        options={categoryOptions}
        value={categoryFilter}
        expanded={expandedFilter === 'category'}
        onToggle={() => toggleFilter('category')}
        onSelect={(value) => {
          setCategoryFilter(value);
          setExpandedFilter(null);
        }}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Последни разходи
        </Text>

        <Text style={styles.countText}>
          {filteredExpenses.length}
        </Text>
      </View>

      {filteredExpenses.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="wallet-outline"
              size={42}
              color={colors.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>
            {hasFilters
              ? 'Няма намерени разходи'
              : 'Все още няма разходи'}
          </Text>

          <Text style={styles.emptyDescription}>
            {hasFilters
              ? 'Промени филтрите, за да видиш други разходи.'
              : 'Тук ще виждаш разходите за гориво, обслужване и поддръжка на автомобилите.'}
          </Text>

          {hasFilters && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={resetFilters}
            >
              <Text style={styles.primaryButtonText}>
                Изчисти филтрите
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        filteredExpenses.map((expense) => (
          <ExpenseCard
            key={expense.uniqueKey}
            expense={expense}
            onPress={() =>
              navigation.navigate('ExpenseDetails', {
                expenseId: expense.id,
              })
            }
          />
        ))
      )}
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

  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },

  errorText: {
    color: colors.text,
    textAlign: 'center',
    fontSize: typography.sizes.md,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
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
    fontSize: 30,
    fontWeight: '700',
  },

  addButton: {
    flexDirection: 'row',
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },

  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },

  totalAmount: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '800',
    marginTop: 12,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },

  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryStat: {
    flex: 1,
    gap: 6,
  },

  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  statValue: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
  },

  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
  },

  resetText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  countText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  filterContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: 12,
    minHeight: 64,
  },

  filterTextContainer: {
    flex: 1,
    gap: 4,
  },

  filterLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },

  filterValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  filterOptions: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.xs,
  },

  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    gap: 8,
  },

  selectedFilterOption: {
    backgroundColor: `${colors.primary}18`,
  },

  filterOptionText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },

  selectedFilterOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },

  expenseCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 12,
  },

  expenseMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  expenseInfo: {
    flex: 1,
    gap: 4,
  },

  expenseTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },

  vehicleName: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  expenseDate: {
    color: colors.textSecondary,
    fontSize: 11,
  },

  expenseAmount: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },

  expenseDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  fuelInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  fuelInfoText: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  fullTankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  fullTankText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '600',
  },

  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B15',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    gap: 6,
  },

  serviceBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '600',
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 12,
  },

  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
