
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import typography from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { getVehicles } from '../../services/vehicleService';

export default function VehiclesScreen({ navigation }) {
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadVehicles = useCallback(async (isRefresh = false) => {
    if (!user?.id) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getVehicles(user.id);
      setVehicles(data || []);
    } catch (error) {
      console.error('Грешка при зареждане на автомобилите:', error);

      Alert.alert(
        'Грешка',
        'Автомобилите не могат да бъдат заредени. Опитай отново.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Зареждаме автомобилите при отваряне на гаража
  useFocusEffect(
    useCallback(() => {
      loadVehicles();
    }, [loadVehicles])
  );

  const handleRefresh = () => {
    loadVehicles(true);
  };

  const renderVehicle = (vehicle) => (
   <TouchableOpacity
  key={vehicle.id}
  style={styles.vehicleCard}
  activeOpacity={0.85}
  onPress={() =>
    navigation.navigate('VehicleDetails', { vehicle })
  }
>
      <View style={styles.vehicleIcon}>
        <Ionicons
          name="car-sport-outline"
          size={32}
          color={colors.primary}
        />
      </View>

      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName}>
          {vehicle.brand} {vehicle.model}
        </Text>

        <Text style={styles.vehicleYear}>
          {vehicle.year || 'Година не е посочена'}
        </Text>

        <View style={styles.vehicleDetails}>
          <View style={styles.detailItem}>
            <Ionicons
              name="card-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={styles.detailText}>
              {vehicle.registration_number}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons
              name="speedometer-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={styles.detailText}>
              {Number(vehicle.mileage || 0).toLocaleString('bg-BG')} км
            </Text>
          </View>
        </View>

        <Text style={styles.fuelText}>
          Гориво: {vehicle.primary_fuel || 'Не е посочено'}
          {vehicle.additional_fuel &&
          vehicle.additional_fuel !== 'none'
            ? ` + ${vehicle.additional_fuel}`
            : ''}
        </Text>

        {vehicle.engine ? (
          <Text style={styles.engineText}>
            Двигател: {vehicle.engine}
          </Text>
        ) : null}
      </View>

      <Ionicons
        name="chevron-forward"
        size={22}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );

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
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitle}>МОЯТ AUTOLOG</Text>
          <Text style={styles.title}>Моят гараж</Text>
        </View>

        <View style={styles.countBadge}>
          <Ionicons
            name="car-sport-outline"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.countText}>{vehicles.length}</Text>
        </View>
      </View>

      <Text style={styles.description}>
        Всички твои автомобили на едно място.
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
          <Text style={styles.loadingText}>
            Зареждане на автомобилите...
          </Text>
        </View>
      ) : vehicles.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="car-sport-outline"
              size={48}
              color={colors.primary}
            />
          </View>

          <Text style={styles.emptyTitle}>
            Гаражът ти е празен
          </Text>

          <Text style={styles.emptyDescription}>
            Добави първия си автомобил, за да следиш неговото
            обслужване, разходи и предстоящи напомняния.
          </Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('VehicleForm')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color={colors.background} />
            <Text style={styles.addButtonText}>
              Добави автомобил
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.vehicleList}>
          {vehicles.map(renderVehicle)}

          <TouchableOpacity
            style={styles.addAnotherButton}
            onPress={() => navigation.navigate('VehicleForm')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={colors.primary}
            />
            <Text style={styles.addAnotherText}>
              Добави още автомобили
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  subtitle: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },

  title: {
    color: colors.text,
    fontSize: typography.sizes.title,
    fontWeight: '700',
  },

  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  countText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },

  description: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },

  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },

  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },

  emptyDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    gap: spacing.sm,
    width: '100%',
  },

  addButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },

  vehicleList: {
    gap: spacing.md,
  },

  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },

  vehicleIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  vehicleInfo: {
    flex: 1,
  },

  vehicleName: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
  },

  vehicleYear: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },

  vehicleDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },

  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  detailText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },

  fuelText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
  },

  engineText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 3,
  },

  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },

  addAnotherText: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    fontWeight: '600',
  },
});
