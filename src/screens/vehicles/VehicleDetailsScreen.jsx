
import { useCallback, useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import typography from '../../constants/typography';

import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

import {
  getVehicleById,
  deleteVehicle,
} from '../../services/vehicleService';

import CustomAlert from '../../components/common/CustomAlert';

export default function VehicleDetailsScreen({ route, navigation }) {
  const initialVehicle = route.params?.vehicle;
  const { user } = useAuth();

  const [vehicle, setVehicle] = useState(initialVehicle || null);

  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Обновяване на данните при отваряне на екрана
  // и при връщане след редактиране.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function refreshVehicle() {
        if (!initialVehicle?.id || !user?.id) return;

        try {
          setRefreshing(true);

          const updatedVehicle = await getVehicleById(
            initialVehicle.id,
            user.id
          );

          if (active) {
            setVehicle(updatedVehicle);
          }
        } catch (error) {
          console.error(
            'Грешка при обновяване на автомобила:',
            error
          );
        } finally {
          if (active) {
            setRefreshing(false);
          }
        }
      }

      refreshVehicle();

      return () => {
        active = false;
      };
    }, [initialVehicle?.id, user?.id])
  );

  // Зареждане на снимката от Supabase Storage.
  useEffect(() => {
    let active = true;

    async function loadVehicleImage() {
      setImageUrl(null);

      if (!vehicle?.image_url) {
        setImageLoading(false);
        return;
      }

      try {
        setImageLoading(true);

        const { data, error } = await supabase.storage
          .from('vehicle-images')
          .createSignedUrl(vehicle.image_url, 3600);

        if (error) throw error;

        if (active) {
          setImageUrl(data.signedUrl);
        }
      } catch (error) {
        console.error(
          'Грешка при зареждане на снимката:',
          error
        );

        if (active) {
          setImageUrl(null);
        }
      } finally {
        if (active) {
          setImageLoading(false);
        }
      }
    }

    loadVehicleImage();

    return () => {
      active = false;
    };
  }, [vehicle?.image_url]);

  const handleEdit = () => {
    if (!vehicle || deleting) return;

    navigation.navigate('VehicleForm', {
      vehicle,
    });
  };

  const openServiceHistory = () => {
    if (!vehicle || deleting) return;

    navigation.navigate('ServiceHistory', {
      vehicle,
    });
  };

  const handleDelete = async () => {
    if (!vehicle?.id || !user?.id || deleting) return;

    try {
      setDeleting(true);
      setDeleteError('');

      await deleteVehicle(vehicle.id, user.id);

      setDeleteAlertVisible(false);

      // Връщане към списъка с автомобили.
      navigation.goBack();
    } catch (error) {
      console.error(
        'Грешка при изтриване на автомобила:',
        error
      );

      setDeleteAlertVisible(false);

      setDeleteError(
        error.message ||
          'Неуспешно изтриване на автомобила.'
      );
    } finally {
      setDeleting(false);
    }
  };

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
    fuelLabels[fuel?.toLowerCase()] ||
    fuel ||
    'Не е посочено';

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
          <Text style={styles.backButtonText}>
            Назад
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIcon}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            disabled={deleting}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Автомобил
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Vehicle hero */}
        <View style={styles.heroCard}>
          <View style={styles.carIconContainer}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.vehicleImage}
                resizeMode="cover"
                onError={() => setImageUrl(null)}
              />
            ) : imageLoading ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
              />
            ) : (
              <Ionicons
                name="car-sport"
                size={76}
                color={colors.primary}
              />
            )}
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

          {refreshing && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.refreshIndicator}
            />
          )}
        </View>

        {/* Mileage */}
        <View style={styles.mileageCard}>
          <View style={styles.mileageIcon}>
            <Ionicons
              name="speedometer-outline"
              size={25}
              color={colors.primary}
            />
          </View>

          <View>
            <Text style={styles.sectionLabel}>
              ТЕКУЩ ПРОБЕГ
            </Text>

            <Text style={styles.mileageValue}>
              {formatMileage(vehicle.mileage)}
            </Text>
          </View>
        </View>

        {/* Basic information */}
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
            isLast
          />
        </View>

        {/* Engine and fuel */}
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

        {/* Vehicle management */}
        <Text style={styles.sectionTitle}>
          Управление на автомобила
        </Text>

        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.85}
          onPress={handleEdit}
          disabled={deleting}
        >
          <Ionicons
            name="create-outline"
            size={22}
            color={colors.background}
          />

          <Text style={styles.editButtonText}>
            Редактирай автомобила
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            deleting && styles.disabledButton,
          ]}
          activeOpacity={0.85}
          disabled={deleting}
          onPress={() => {
            setDeleteError('');
            setDeleteAlertVisible(true);
          }}
        >
          {deleting ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <Ionicons
              name="trash-outline"
              size={22}
              color={colors.danger}
            />
          )}

          <Text style={styles.deleteButtonText}>
            {deleting
              ? 'Изтриване...'
              : 'Изтрий автомобила'}
          </Text>
        </TouchableOpacity>

        {/* Service history */}
        <Text style={styles.sectionTitle}>
          Сервизна история
        </Text>

        <TouchableOpacity
          style={styles.serviceCard}
          activeOpacity={0.85}
          onPress={openServiceHistory}
          disabled={deleting}
        >
          <View style={styles.serviceIcon}>
            <Ionicons
              name="construct-outline"
              size={26}
              color={colors.primary}
            />
          </View>

          <View style={styles.serviceContent}>
            <Text style={styles.serviceTitle}>
              Обслужвания и ремонти
            </Text>

            <Text style={styles.serviceDescription}>
              Преглед и добавяне на сервизни записи
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color={colors.primary}
          />
        </TouchableOpacity>
      </ScrollView>

      {/* Delete confirmation */}
      <CustomAlert
        visible={deleteAlertVisible}
        title="Изтриване на автомобил"
        message={
          `Сигурен ли си, че искаш да изтриеш ` +
          `${vehicle.brand} ${vehicle.model} ` +
          `(${vehicle.registration_number})?\n\n` +
          'Всички сервизни записи за този автомобил ' +
          'също ще бъдат изтрити завинаги.\n\n' +
          'Това действие е необратимо.'
        }
        type="warning"
        confirmText={deleting ? 'Изтриване...' : 'Изтрий'}
        cancelText="Отказ"
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) {
            setDeleteAlertVisible(false);
          }
        }}
      />

      {/* Error message */}
      <CustomAlert
        visible={Boolean(deleteError)}
        title="Грешка при изтриване"
        message={deleteError}
        type="error"
        confirmText="Разбрах"
        onConfirm={() => setDeleteError('')}
      />
    </>
  );
}

function InfoRow({ icon, label, value, isLast }) {
  return (
    <View
      style={[
        styles.infoRow,
        !isLast && styles.infoRowBorder,
      ]}
    >
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={20}
          color={colors.textSecondary}
        />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value !== null &&
          value !== undefined &&
          value !== ''
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
    overflow: 'hidden',
  },

  vehicleImage: {
    width: '100%',
    height: '100%',
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

  refreshIndicator: {
    marginTop: spacing.md,
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

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.lg,
  },

  editButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
  },

  deleteButtonText: {
    color: colors.danger,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.6,
  },

  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  serviceIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  serviceContent: {
    flex: 1,
  },

  serviceTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },

  serviceDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    lineHeight: 20,
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
