
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import colors from '../../../constants/colors';
import spacing from '../../../constants/spacing';
import typography from '../../../constants/typography';

import {
  createServiceRecord,
  updateServiceRecord,
} from '../../../services/serviceRecordService';

const SERVICE_TYPES = [
  { value: 'oil', label: 'Масло и филтри' },
  { value: 'timing', label: 'Ангренаж' },
  { value: 'brakes', label: 'Спирачна система' },
  { value: 'suspension', label: 'Окачване' },
  { value: 'tires', label: 'Гуми' },
  { value: 'repair', label: 'Ремонт' },
  { value: 'other', label: 'Друго' },
];

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function ServiceFormScreen({ route, navigation }) {
  const vehicle = route.params?.vehicle;
  const record = route.params?.record;

  const isEditing = Boolean(record?.id);

  const [serviceType, setServiceType] = useState(
    record?.category || 'oil'
  );

  const [date, setDate] = useState(
    record?.service_date || getTodayDate()
  );

  const [mileage, setMileage] = useState(
    record?.mileage != null
      ? String(record.mileage)
      : vehicle?.mileage != null
        ? String(vehicle.mileage)
        : ''
  );

  const [description, setDescription] = useState(
    record?.description || ''
  );

  const [cost, setCost] = useState(
    record?.cost != null ? String(record.cost) : ''
  );

  const [showTypes, setShowTypes] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedType = SERVICE_TYPES.find(
    (item) => item.value === serviceType
  );

  const handleSave = async () => {
    if (saving) return;

    if (!vehicle?.id) {
      Alert.alert('Грешка', 'Не е избран автомобил.');
      return;
    }

    const dateValue = date.trim();
    const mileageValue = mileage.trim();
    const costValue = cost.trim();

    const parsedDate = new Date(`${dateValue}T12:00:00`);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dateValue) ||
      Number.isNaN(parsedDate.getTime()) ||
      [
        parsedDate.getFullYear(),
        String(parsedDate.getMonth() + 1).padStart(2, '0'),
        String(parsedDate.getDate()).padStart(2, '0'),
      ].join('-') !== dateValue
    ) {
      Alert.alert(
        'Невалидна дата',
        'Въведете дата във формат ГГГГ-ММ-ДД.'
      );
      return;
    }

    if (
      !/^\d+$/.test(mileageValue) ||
      !Number.isSafeInteger(Number(mileageValue)) ||
      Number(mileageValue) > 2147483647
    ) {
      Alert.alert(
        'Невалиден пробег',
        'Въведете положително цяло число за пробега.'
      );
      return;
    }

    const normalizedCost = costValue.replace(',', '.');

    if (
      costValue !== '' &&
      (!/^\d+(\.\d{1,2})?$/.test(normalizedCost) ||
        !Number.isFinite(Number(normalizedCost)) ||
        Number(normalizedCost) > 9999999999.99)
    ) {
      Alert.alert(
        'Невалидна стойност',
        'Въведете валидна сума, например 250.00.'
      );
      return;
    }

    const formData = {
      serviceType,
      title: selectedType?.label || 'Обслужване',
      date: dateValue,
      mileage: mileageValue,
      description,
      cost: normalizedCost,
    };

    try {
      setSaving(true);

      if (isEditing) {
        await updateServiceRecord(record.id, formData);
      } else {
        await createServiceRecord(vehicle, formData);
      }

      Alert.alert(
        isEditing ? 'Успешна редакция' : 'Успешен запис',
        isEditing
          ? 'Обслужването е обновено успешно.'
          : 'Обслужването е записано успешно.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (isEditing) {
                navigation.pop(2);
              } else {
                navigation.goBack();
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Service record save error:', error);

      Alert.alert(
        isEditing
          ? 'Грешка при редактиране'
          : 'Грешка при записване',
        error?.message ||
          'Неуспешно записване на обслужването.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
            {isEditing
              ? 'Редактиране на обслужване'
              : 'Ново обслужване'}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.vehicleCard}>
          <Ionicons
            name="car-sport"
            size={28}
            color={colors.primary}
          />

          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>
              {vehicle?.brand} {vehicle?.model}
            </Text>

            <Text style={styles.vehicleRegistration}>
              {vehicle?.registration_number}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Информация за обслужването
        </Text>

        <Text style={styles.label}>
          Тип обслужване *
        </Text>

        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowTypes(!showTypes)}
          disabled={saving}
        >
          <Text style={styles.inputText}>
            {selectedType?.label}
          </Text>

          <Ionicons
            name={showTypes ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {showTypes && (
          <View style={styles.dropdown}>
            {SERVICE_TYPES.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={styles.dropdownItem}
                disabled={saving}
                onPress={() => {
                  setServiceType(item.value);
                  setShowTypes(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    serviceType === item.value &&
                      styles.dropdownSelected,
                  ]}
                >
                  {item.label}
                </Text>

                {serviceType === item.value && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>
          Дата на обслужване *
        </Text>

        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="ГГГГ-ММ-ДД"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          editable={!saving}
        />

        <Text style={styles.label}>
          Пробег (км) *
        </Text>

        <TextInput
          style={styles.input}
          value={mileage}
          onChangeText={setMileage}
          placeholder="Например 185000"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          editable={!saving}
        />

        <Text style={styles.label}>
          Описание
        </Text>

        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Какво е извършено?"
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
          editable={!saving}
        />

        <Text style={styles.label}>
          Стойност (лв.)
        </Text>

        <TextInput
          style={styles.input}
          value={cost}
          onChangeText={setCost}
          placeholder="Например 250.00"
          placeholderTextColor={colors.textSecondary}
          keyboardType="decimal-pad"
          editable={!saving}
        />

        <TouchableOpacity
          style={[
            styles.saveButton,
            saving && styles.saveButtonDisabled,
          ]}
          activeOpacity={0.85}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color={colors.background}
            />
          ) : (
            <Ionicons
              name="checkmark-circle-outline"
              size={23}
              color={colors.background}
            />
          )}

          <Text style={styles.saveButtonText}>
            {saving
              ? 'Записване...'
              : isEditing
                ? 'Запази промените'
                : 'Запази обслужването'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
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

  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },

  label: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  input: {
    minHeight: 52,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: typography.sizes.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  inputText: {
    color: colors.text,
    fontSize: typography.sizes.md,
  },

  dropdown: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },

  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  dropdownText: {
    color: colors.text,
    fontSize: typography.sizes.md,
  },

  dropdownSelected: {
    color: colors.primary,
    fontWeight: '700',
  },

  textArea: {
    height: 110,
    paddingTop: spacing.md,
  },

  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    marginTop: spacing.xxl,
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
});
