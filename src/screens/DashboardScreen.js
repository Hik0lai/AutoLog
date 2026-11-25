
import { useCallback, useRef, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import {
  useNavigation,
  useFocusEffect,
} from '@react-navigation/native';

import colors from '../constants/colors';
import spacing from '../constants/spacing';
import typography from '../constants/typography';

import { useAuth } from '../context/AuthContext';
import { getVehicles } from '../services/vehicleService';
import { getCombinedExpenses } from '../services/expenseService';
import { supabase } from '../services/supabase';

function formatMoney(value) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getCurrentMonthKey() {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, '0')}`;
}

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const { width } = useWindowDimensions();

  const scrollRef = useRef(null);

  const [vehicles, setVehicles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [monthlyExpenses, setMonthlyExpenses] =
    useState(0);

  const [expensesLoading, setExpensesLoading] =
    useState(true);

  const [expensesError, setExpensesError] =
    useState(false);

  const cardWidth = width - spacing.lg * 2;

  // Зареждане на автомобилите и техните снимки
  const loadVehicles = useCallback(async () => {
    if (!user?.id) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getVehicles(user.id);

      // Генериране на временни URL адреси за снимките
      const vehiclesWithImages = await Promise.all(
        (data || []).map(async (vehicle) => {
          if (!vehicle.image_url) {
            return {
              ...vehicle,
              signedImageUrl: null,
            };
          }

          try {
            const { data: imageData, error } =
              await supabase.storage
                .from('vehicle-images')
                .createSignedUrl(
                  vehicle.image_url,
                  3600
                );

            if (error) {
              throw error;
            }

            return {
              ...vehicle,
              signedImageUrl: imageData.signedUrl,
            };
          } catch (imageError) {
            console.error(
              `Грешка при зареждане на снимката за ${vehicle.brand} ${vehicle.model}:`,
              imageError
            );

            return {
              ...vehicle,
              signedImageUrl: null,
            };
          }
        })
      );

      setVehicles(vehiclesWithImages);
      setCurrentIndex(0);
    } catch (error) {
      console.error(
        'Dashboard vehicles error:',
        error
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Зареждане на разходите за текущия месец
  const loadMonthlyExpenses = useCallback(async () => {
    if (!user?.id) {
      setMonthlyExpenses(0);
      setExpensesError(false);
      setExpensesLoading(false);
      return;
    }

    try {
      setExpensesLoading(true);
      setExpensesError(false);

      const expenses = await getCombinedExpenses(
        user.id
      );

      const currentMonth = getCurrentMonthKey();

      const total = (expenses || [])
        .filter(
          (expense) =>
            expense.expense_date?.slice(0, 7) ===
            currentMonth
        )
        .reduce(
          (sum, expense) =>
            sum + Number(expense.amount || 0),
          0
        );

      setMonthlyExpenses(total);
    } catch (error) {
      console.error(
        'Dashboard expenses error:',
        error
      );

      setExpensesError(true);
    } finally {
      setExpensesLoading(false);
    }
  }, [user?.id]);

  // Обновяване при всяко отваряне на началния екран
  useFocusEffect(
    useCallback(() => {
      loadVehicles();
      loadMonthlyExpenses();
    }, [loadVehicles, loadMonthlyExpenses])
  );

  // Преминаване към конкретен автомобил
  const scrollToVehicle = (index) => {
    if (index < 0 || index >= vehicles.length) {
      return;
    }

    scrollRef.current?.scrollTo({
      x: index * cardWidth,
      animated: true,
    });

    setCurrentIndex(index);
  };

  // Отчитане на текущия автомобил при плъзгане
  const handleScrollEnd = (event) => {
    const offsetX =
      event.nativeEvent.contentOffset.x;

    const index = Math.round(
      offsetX / cardWidth
    );

    setCurrentIndex(index);
  };

  const openGarage = () => {
    navigation.navigate('Гараж');
  };

  const openExpenses = () => {
    navigation.navigate('Разходи', {
      screen: 'ExpensesList',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Добре дошъл!
          </Text>

          <Text style={styles.title}>
            Моят AutoLog
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() =>
            navigation.navigate('Профил')
          }
        >
          <Ionicons
            name="person-outline"
            size={23}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Garage section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Моят гараж
        </Text>

        <TouchableOpacity onPress={openGarage}>
          <Text style={styles.seeAll}>
            Виж всички
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vehicle loading */}
      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Зареждане на автомобилите...
          </Text>
        </View>
      ) : vehicles.length === 0 ? (
        /* Empty garage */
        <TouchableOpacity
          style={styles.vehicleCard}
          activeOpacity={0.85}
          onPress={openGarage}
        >
          <View style={styles.vehicleImage}>
            <Ionicons
              name="car-sport"
              size={105}
              color={colors.primary}
            />

            <View style={styles.imageLabel}>
              <Ionicons
                name="add-circle-outline"
                size={17}
                color={colors.textSecondary}
              />

              <Text style={styles.imageLabelText}>
                Добави автомобил
              </Text>
            </View>
          </View>

          <View style={styles.vehicleInfo}>
            <View>
              <Text style={styles.vehicleTitle}>
                Твоят гараж е празен
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
      ) : (
        <>
          {/* Vehicles carousel */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            decelerationRate="fast"
            style={styles.carousel}
          >
            {vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  { width: cardWidth },
                ]}
                activeOpacity={0.85}
                onPress={openGarage}
              >
                <View style={styles.vehicleImage}>
                  {vehicle.signedImageUrl ? (
                    <Image
                      source={{
                        uri: vehicle.signedImageUrl,
                      }}
                      style={styles.vehiclePhoto}
                      resizeMode="cover"
                      onError={() => {
                        console.error(
                          `Снимката на ${vehicle.brand} ${vehicle.model} не може да бъде визуализирана.`
                        );

                        setVehicles(
                          (currentVehicles) =>
                            currentVehicles.map(
                              (item) =>
                                item.id === vehicle.id
                                  ? {
                                      ...item,
                                      signedImageUrl: null,
                                    }
                                  : item
                            )
                        );
                      }}
                    />
                  ) : (
                    <Ionicons
                      name="car-sport"
                      size={105}
                      color={colors.primary}
                    />
                  )}

                  <View style={styles.imageLabel}>
                    <Ionicons
                      name="car-outline"
                      size={15}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.imageLabelText}>
                      Моят автомобил
                    </Text>
                  </View>
                </View>

                <View style={styles.vehicleInfo}>
                  <View
                    style={styles.vehicleTextContainer}
                  >
                    <Text
                      style={styles.vehicleTitle}
                      numberOfLines={1}
                    >
                      {vehicle.brand} {vehicle.model}
                    </Text>

                    <Text style={styles.vehicleSubtitle}>
                      {vehicle.year} г. ·{' '}
                      {vehicle.registration_number}
                    </Text>

                    <Text style={styles.vehicleMileage}>
                      {Number(
                        vehicle.mileage
                      ).toLocaleString('bg-BG')}{' '}
                      км
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={23}
                    color={colors.primary}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Carousel controls */}
          {vehicles.length > 1 && (
            <View style={styles.carouselControls}>
              <TouchableOpacity
                style={[
                  styles.arrowButton,
                  currentIndex === 0 &&
                    styles.arrowDisabled,
                ]}
                disabled={currentIndex === 0}
                onPress={() =>
                  scrollToVehicle(currentIndex - 1)
                }
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={
                    currentIndex === 0
                      ? colors.textSecondary
                      : colors.primary
                  }
                />
              </TouchableOpacity>

              <View style={styles.pagination}>
                {vehicles.map((vehicle, index) => (
                  <View
                    key={vehicle.id}
                    style={[
                      styles.paginationDot,
                      currentIndex === index &&
                        styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.arrowButton,
                  currentIndex ===
                    vehicles.length - 1 &&
                    styles.arrowDisabled,
                ]}
                disabled={
                  currentIndex === vehicles.length - 1
                }
                onPress={() =>
                  scrollToVehicle(currentIndex + 1)
                }
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={
                    currentIndex === vehicles.length - 1
                      ? colors.textSecondary
                      : colors.primary
                  }
                />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Statistics */}
      <Text style={styles.sectionTitle}>
        Обобщение
      </Text>

      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.8}
          onPress={openGarage}
          accessibilityRole="button"
          accessibilityLabel="Моят гараж"
        >
          <View style={styles.statCardHeader}>
            <View style={styles.statIcon}>
              <Ionicons
                name="car-outline"
                size={22}
                color={colors.primary}
              />
            </View>

            <Ionicons
              name="chevron-forward"
              size={17}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.statValue}>
            {loading ? '—' : vehicles.length}
          </Text>

          <Text style={styles.statLabel}>
            Автомобили
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          activeOpacity={0.8}
          onPress={openExpenses}
          accessibilityRole="button"
          accessibilityLabel="Разходи този месец"
        >
          <View style={styles.statCardHeader}>
            <View style={styles.statIcon}>
              <Ionicons
                name="wallet-outline"
                size={22}
                color={colors.success}
              />
            </View>

            <Ionicons
              name="chevron-forward"
              size={17}
              color={colors.textSecondary}
            />
          </View>

          {expensesLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.statLoading}
            />
          ) : (
            <Text
              style={[
                styles.statValue,
                styles.expensesValue,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {expensesError
                ? '—'
                : formatMoney(monthlyExpenses)}
            </Text>
          )}

          <Text style={styles.statLabel}>
            Разходи този месец
          </Text>

          {expensesError && (
            <Text style={styles.statError}>
              Неуспешно зареждане
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Reminders */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Напомняния
        </Text>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Напомняния')
          }
        >
          <Text style={styles.seeAll}>
            Виж всички
          </Text>
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
            Добави автомобил и създай първото си
            напомняне.
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
    overflow: 'hidden',
  },

  vehiclePhoto: {
    width: '100%',
    height: '100%',
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

  vehicleTextContainer: {
    flex: 1,
    marginRight: spacing.sm,
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

  vehicleMileage: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
  },

  loadingCard: {
    height: 240,
    backgroundColor: colors.surface,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.md,
  },

  carousel: {
    marginBottom: spacing.sm,
  },

  carouselControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },

  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  arrowDisabled: {
    opacity: 0.4,
  },

  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },

  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },

  paginationDotActive: {
    width: 19,
    backgroundColor: colors.primary,
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

  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },

  expensesValue: {
    color: colors.success,
  },

  statLoading: {
    alignSelf: 'flex-start',
    minHeight: 28,
  },

  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },

  statError: {
    color: colors.danger,
    fontSize: 10,
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
