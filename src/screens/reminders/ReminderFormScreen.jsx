
import { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import typography from '../../constants/typography';

import { useAuth } from '../../context/AuthContext';

import CustomAlert from '../../components/common/CustomAlert';

import { getVehicles } from '../../services/vehicleService';

import {
  createReminder,
  updateReminder,
} from '../../services/reminderService';

const categories = [
  {
    value: 'inspection',
    label: 'Годишен технически преглед',
    icon: 'clipboard-outline',
    dateOnly: true,
  },
  {
    value: 'insurance',
    label: 'Гражданска отговорност',
    icon: 'shield-checkmark-outline',
    dateOnly: true,
  },
  {
    value: 'casco',
    label: 'Каско',
    icon: 'shield-outline',
    dateOnly: true,
  },
  {
    value: 'vignette',
    label: 'Винетка',
    icon: 'ticket-outline',
    dateOnly: true,
  },
  {
    value: 'oil',
    label: 'Смяна на масло и филтри',
    icon: 'water-outline',
    dateOnly: false,
  },
  {
    value: 'timing_belt',
    label: 'Смяна на ангренажен ремък',
    icon: 'construct-outline',
    dateOnly: false,
  },
  {
    value: 'other',
    label: 'Друго',
    icon: 'notifications-outline',
    dateOnly: false,
  },
];

function formatDateForDatabase(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDatabaseDate(date) {
  if (!date) return new Date();

  const [year, month, day] = date
    .split('-')
    .map(Number);

  return new Date(year, month - 1, day);
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('bg-BG');
}

function isValidInteger(value) {
  return (
    /^\d+$/.test(String(value).trim()) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) <= 2147483647
  );
}

export default function ReminderFormScreen({
  navigation,
  route,
}) {
  const { user } = useAuth();

  const existingReminder = route.params?.reminder;
  const isEditing = Boolean(existingReminder);

  const [vehicles, setVehicles] = useState([]);

  const [loadingVehicles, setLoadingVehicles] =
    useState(true);

  const [vehiclesError, setVehiclesError] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [vehicleId, setVehicleId] = useState(
    existingReminder?.vehicle_id ||
      route.params?.vehicleId ||
      ''
  );

  const [category, setCategory] = useState(
    existingReminder?.category || ''
  );

  const [title, setTitle] = useState(
    existingReminder?.title || ''
  );

  const [description, setDescription] = useState(
    existingReminder?.description || ''
  );

  const [useDate, setUseDate] = useState(
    isEditing
      ? Boolean(existingReminder.due_date)
      : true
  );

  const [useMileage, setUseMileage] = useState(
    isEditing
      ? existingReminder.due_mileage != null
      : false
  );

  const [dueDate, setDueDate] = useState(
    parseDatabaseDate(existingReminder?.due_date)
  );

  const [dueMileage, setDueMileage] = useState(
    existingReminder?.due_mileage != null
      ? String(existingReminder.due_mileage)
      : ''
  );

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(
      existingReminder?.notifications_enabled ?? true
    );

  const [notifyDaysBefore, setNotifyDaysBefore] =
    useState(
      String(existingReminder?.notify_days_before ?? 7)
    );

  const [notifyKmBefore, setNotifyKmBefore] =
    useState(
      String(existingReminder?.notify_km_before ?? 500)
    );

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [showVehicles, setShowVehicles] =
    useState(false);

  const [showCategories, setShowCategories] =
    useState(false);

  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
  });

  const selectedVehicle = vehicles.find(
    vehicle => vehicle.id === vehicleId
  );

  const selectedCategory = categories.find(
    item => item.value === category
  );

  const dateOnly = selectedCategory?.dateOnly ?? false;

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
    onConfirm = null,
  }) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      onConfirm,
    });
  };

  useEffect(() => {
    let active = true;

    async function loadVehicles() {
      if (!user?.id) {
        if (active) {
          setLoadingVehicles(false);
        }

        return;
      }

      try {
        setLoadingVehicles(true);
        setVehiclesError(false);

        const data = await getVehicles(user.id);

        if (!active) return;

        const availableVehicles = data || [];

        setVehicles(availableVehicles);

        setVehicleId(current => {
          if (
            current &&
            availableVehicles.some(
              vehicle => vehicle.id === current
            )
          ) {
            return current;
          }

          if (availableVehicles.length === 1) {
            return availableVehicles[0].id;
          }

          return '';
        });
      } catch (error) {
        console.error('Load vehicles error:', error);

        if (active) {
          setVehiclesError(true);
        }
      } finally {
        if (active) {
          setLoadingVehicles(false);
        }
      }
    }

    loadVehicles();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const handleCategorySelect = item => {
    const previousCategory = categories.find(
      current => current.value === category
    );

    if (
      !title.trim() ||
      title === previousCategory?.label
    ) {
      setTitle(
        item.value === 'other' ? '' : item.label
      );
    }

    setCategory(item.value);
    setShowCategories(false);

    if (item.dateOnly) {
      setUseDate(true);
      setUseMileage(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const validationError = message => {
    showAlert({
      title: 'Невалидни данни',
      message,
      type: 'warning',
    });

    return false;
  };

  const validateForm = () => {
    if (!selectedVehicle) {
      return validationError(
        'Моля, избери автомобил.'
      );
    }

    if (!selectedCategory) {
      return validationError(
        'Моля, избери категория.'
      );
    }

    if (!title.trim()) {
      return validationError(
        'Моля, въведи заглавие.'
      );
    }

    if (!useDate && !useMileage) {
      return validationError(
        'Трябва да зададеш поне един краен срок — дата или километраж.'
      );
    }

    if (dateOnly && !useDate) {
      return validationError(
        'Тази категория изисква краен срок по дата.'
      );
    }

    if (
      useMileage &&
      !isValidInteger(dueMileage)
    ) {
      return validationError(
        'Въведи валиден краен километраж.'
      );
    }

    if (
      notificationsEnabled &&
      useDate &&
      !isValidInteger(notifyDaysBefore)
    ) {
      return validationError(
        'Въведи валиден брой дни за предварително известяване.'
      );
    }

    if (
      notificationsEnabled &&
      useMileage &&
      !isValidInteger(notifyKmBefore)
    ) {
      return validationError(
        'Въведи валиден брой километри за предварително известяване.'
      );
    }

    return true;
  };

  const handleSave = async () => {
    if (saving) return;

    if (!user?.id) {
      showAlert({
        title: 'Грешка',
        message: 'Няма активна потребителска сесия.',
        type: 'error',
      });

      return;
    }

    if (!validateForm()) return;

    try {
      setSaving(true);

      const reminderData = {
        vehicleId,
        category,
        title: title.trim(),
        description: description.trim(),

        dueDate: useDate
          ? formatDateForDatabase(dueDate)
          : null,

        dueMileage: useMileage
          ? Number(dueMileage)
          : null,

        notificationsEnabled,

        notifyDaysBefore:
          isValidInteger(notifyDaysBefore)
            ? Number(notifyDaysBefore)
            : 7,

        notifyKmBefore:
          isValidInteger(notifyKmBefore)
            ? Number(notifyKmBefore)
            : 500,
      };

      if (isEditing) {
        await updateReminder(
          existingReminder.id,
          reminderData,
          user.id
        );
      } else {
        await createReminder(
          reminderData,
          user.id
        );
      }

      showAlert({
        title: 'Успешен запис',
        message: isEditing
          ? 'Напомнянето беше обновено успешно.'
          : 'Напомнянето беше добавено успешно.',
        type: 'success',
        onConfirm: () => navigation.goBack(),
      });
    } catch (error) {
      console.error('Save reminder error:', error);

      showAlert({
        title: 'Грешка при записване',
        message:
          'Напомнянето не можа да бъде запазено. Опитай отново.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={saving}
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
                {isEditing
                  ? 'Редактирай напомняне'
                  : 'Ново напомняне'}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>
            Следи предстоящите обслужвания и
            документи на своите автомобили.
          </Text>

          {/* Vehicle */}
          <Text style={styles.label}>
            Автомобил *
          </Text>

          {loadingVehicles ? (
            <ActivityIndicator
              color={colors.primary}
              style={styles.loader}
            />
          ) : vehiclesError ? (
            <Text style={styles.errorText}>
              Автомобилите не могат да бъдат заредени.
              Отвори формата отново.
            </Text>
          ) : vehicles.length === 0 ? (
            <Text style={styles.errorText}>
              Първо трябва да добавиш автомобил
              в своя гараж.
            </Text>
          ) : (
            <>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  setShowVehicles(!showVehicles);
                  setShowCategories(false);
                }}
              >
                <Ionicons
                  name="car-sport-outline"
                  size={22}
                  color={colors.primary}
                />

                <Text
                  style={[
                    styles.selectText,
                    !selectedVehicle &&
                      styles.placeholderText,
                  ]}
                >
                  {selectedVehicle
                    ? `${selectedVehicle.brand} ${selectedVehicle.model}`
                    : 'Избери автомобил'}
                </Text>

                <Ionicons
                  name={
                    showVehicles
                      ? 'chevron-up'
                      : 'chevron-down'
                  }
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {showVehicles && (
                <View style={styles.optionsContainer}>
                  {vehicles.map(vehicle => (
                    <TouchableOpacity
                      key={vehicle.id}
                      style={[
                        styles.option,
                        vehicleId === vehicle.id &&
                          styles.selectedOption,
                      ]}
                      onPress={() => {
                        setVehicleId(vehicle.id);
                        setShowVehicles(false);
                      }}
                    >
                      <View style={styles.optionContent}>
                        <Text style={styles.optionText}>
                          {vehicle.brand} {vehicle.model}
                        </Text>

                        <Text style={styles.helperText}>
                          {vehicle.registration_number}
                        </Text>
                      </View>

                      {vehicleId === vehicle.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Category */}
          <Text style={styles.label}>
            Категория *
          </Text>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => {
              setShowCategories(!showCategories);
              setShowVehicles(false);
            }}
          >
            <Ionicons
              name={
                selectedCategory?.icon ||
                'list-outline'
              }
              size={22}
              color={colors.primary}
            />

            <Text
              style={[
                styles.selectText,
                !selectedCategory &&
                  styles.placeholderText,
              ]}
            >
              {selectedCategory?.label ||
                'Избери категория'}
            </Text>

            <Ionicons
              name={
                showCategories
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showCategories && (
            <View style={styles.optionsContainer}>
              {categories.map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.option,
                    category === item.value &&
                      styles.selectedOption,
                  ]}
                  onPress={() =>
                    handleCategorySelect(item)
                  }
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={colors.primary}
                  />

                  <Text style={styles.optionText}>
                    {item.label}
                  </Text>

                  {category === item.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Title */}
          <Text style={styles.label}>
            Заглавие *
          </Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Въведи заглавие"
            placeholderTextColor={colors.textSecondary}
            maxLength={120}
          />

          {/* Deadline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Краен срок
            </Text>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={colors.primary}
                />

                <Text style={styles.switchText}>
                  По дата
                </Text>
              </View>

              <Switch
                value={useDate}
                onValueChange={setUseDate}
                disabled={dateOnly}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            {useDate && (
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={colors.primary}
                />

                <Text style={styles.selectText}>
                  {formatDisplayDate(dueDate)}
                </Text>

                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}

            {showDatePicker && useDate && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {!dateOnly && (
              <>
                <View style={styles.switchRow}>
                  <View style={styles.switchLabel}>
                    <Ionicons
                      name="speedometer-outline"
                      size={22}
                      color={colors.primary}
                    />

                    <Text style={styles.switchText}>
                      По километраж
                    </Text>
                  </View>

                  <Switch
                    value={useMileage}
                    onValueChange={setUseMileage}
                    trackColor={{
                      false: colors.border,
                      true: colors.primary,
                    }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {useMileage && (
                  <>
                    <TextInput
                      style={styles.input}
                      value={dueMileage}
                      onChangeText={setDueMileage}
                      keyboardType="number-pad"
                      placeholder="Краен километраж (км)"
                      placeholderTextColor={
                        colors.textSecondary
                      }
                    />

                    {selectedVehicle?.mileage != null && (
                      <Text style={styles.helperText}>
                        Текущ километраж:{' '}
                        {Number(
                          selectedVehicle.mileage
                        ).toLocaleString('bg-BG')}{' '}
                        км
                      </Text>
                    )}
                  </>
                )}
              </>
            )}

            {useDate && useMileage && (
              <Text style={styles.helperText}>
                Напомнянето ще следи и двата срока.
              </Text>
            )}
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.sectionTitle}>
                Известия
              </Text>

              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
              />
            </View>

            {notificationsEnabled && (
              <>
                <Text style={styles.helperText}>
                  Настройки за предварително
                  известяване.
                </Text>

                {useDate && (
                  <>
                    <Text style={styles.label}>
                      Предупреди по-рано (дни)
                    </Text>

                    <TextInput
                      style={styles.input}
                      value={notifyDaysBefore}
                      onChangeText={setNotifyDaysBefore}
                      keyboardType="number-pad"
                      placeholder="7"
                      placeholderTextColor={
                        colors.textSecondary
                      }
                    />
                  </>
                )}

                {useMileage && (
                  <>
                    <Text style={styles.label}>
                      Предупреди по-рано (км)
                    </Text>

                    <TextInput
                      style={styles.input}
                      value={notifyKmBefore}
                      onChangeText={setNotifyKmBefore}
                      keyboardType="number-pad"
                      placeholder="500"
                      placeholderTextColor={
                        colors.textSecondary
                      }
                    />
                  </>
                )}
              </>
            )}
          </View>

          {/* Description */}
          <Text style={styles.label}>
            Допълнителни бележки
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.textArea,
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Въведи бележки..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={1000}
          />

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (
                saving ||
                loadingVehicles ||
                vehicles.length === 0 ||
                vehiclesError
              ) && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={
              saving ||
              loadingVehicles ||
              vehicles.length === 0 ||
              vehiclesError
            }
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator
                color={colors.background}
              />
            ) : (
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color={colors.background}
              />
            )}

            <Text style={styles.saveButtonText}>
              {saving
                ? 'Запазване...'
                : isEditing
                  ? 'Запази промените'
                  : 'Запази напомнянето'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        confirmText="Разбрах"
        onConfirm={() => {
          const action = alert.onConfirm;

          hideAlert();

          if (action) action();
        }}
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
    paddingBottom: spacing.xxxl,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
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

  description: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },

  label: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: typography.sizes.md,
    minHeight: 52,
  },

  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 54,
  },

  selectText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.md,
  },

  placeholderText: {
    color: colors.textSecondary,
  },

  optionsContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  selectedOption: {
    backgroundColor: colors.surfaceElevated,
  },

  optionContent: {
    flex: 1,
  },

  optionText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },

  section: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    marginVertical: spacing.xs,
  },

  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  switchText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: '500',
  },

  helperText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    lineHeight: 19,
    marginTop: spacing.sm,
  },

  textArea: {
    minHeight: 110,
  },

  loader: {
    marginVertical: spacing.lg,
  },

  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
    marginVertical: spacing.sm,
  },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },

  saveButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.5,
  },
});
