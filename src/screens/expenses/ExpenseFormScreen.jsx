
import { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import colors from '../../constants/colors';
import spacing from '../../constants/spacing';

import { useAuth } from '../../context/AuthContext';
import CustomAlert from '../../components/common/CustomAlert';

import { getVehicles } from '../../services/vehicleService';

import {
  createExpense,
  updateExpense,
} from '../../services/expenseService';

const CATEGORIES = [
  { value: 'fuel', label: 'Гориво', icon: 'speedometer-outline' },
  { value: 'repairs', label: 'Ремонти и обслужване', icon: 'construct-outline' },
  { value: 'consumables', label: 'Консумативи', icon: 'settings-outline' },
  { value: 'insurance', label: 'Застраховки', icon: 'shield-checkmark-outline' },
  { value: 'fees', label: 'Данъци и такси', icon: 'receipt-outline' },
  { value: 'vignette', label: 'Винетки', icon: 'ticket-outline' },
  { value: 'inspection', label: 'Технически преглед', icon: 'clipboard-outline' },
  { value: 'parking', label: 'Паркинг', icon: 'car-outline' },
  { value: 'car_wash', label: 'Автомивка', icon: 'water-outline' },
  { value: 'other', label: 'Други', icon: 'ellipsis-horizontal-outline' },
];

function normalizeFuel(value) {
  const fuel = String(value || '').trim().toLowerCase();

  const fuelMap = {
    petrol: 'petrol',
    gasoline: 'petrol',
    benzine: 'petrol',
    бензин: 'petrol',

    diesel: 'diesel',
    дизел: 'diesel',

    lpg: 'lpg',
    gas: 'lpg',
    газ: 'lpg',
    пропан: 'lpg',

    cng: 'cng',
    methane: 'cng',
    метан: 'cng',

    hybrid: 'hybrid',
    хибрид: 'hybrid',

    electric: 'electric',
    електрически: 'electric',
    електричество: 'electric',
  };

  return fuelMap[fuel] || null;
}

function getFuelOptions(vehicle) {
  if (!vehicle) return [];

  const options = [];

  const primary = normalizeFuel(vehicle.primary_fuel);
  const additional = normalizeFuel(vehicle.additional_fuel);

  const addFuel = (value, label) => {
    if (!options.some((item) => item.value === value)) {
      options.push({ value, label });
    }
  };

  if (primary === 'petrol') {
    addFuel('petrol', 'Бензин');
  }

  if (primary === 'diesel') {
    addFuel('diesel', 'Дизел');
  }

  if (primary === 'hybrid') {
    addFuel('petrol', 'Бензин');
    addFuel('diesel', 'Дизел');
    addFuel('electric', 'Електричество');
  }

  if (primary === 'electric') {
    addFuel('electric', 'Електричество');
  }

  if (primary === 'lpg' || additional === 'lpg') {
    addFuel('lpg', 'Газ (LPG)');
  }

  if (primary === 'cng' || additional === 'cng') {
    addFuel('cng', 'Метан (CNG)');
  }

  if (options.length === 0) {
    addFuel('petrol', 'Бензин');
    addFuel('diesel', 'Дизел');
    addFuel('lpg', 'Газ (LPG)');
    addFuel('cng', 'Метан (CNG)');
    addFuel('electric', 'Електричество');
  }

  return options;
}

function parseDecimal(value) {
  const normalized = String(value ?? '')
    .trim()
    .replace(',', '.');

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return NaN;
  }

  return Number(normalized);
}

function parseLocalDate(value) {
  if (!value) return new Date();

  const [year, month, day] = value
    .split('-')
    .map(Number);

  return new Date(year, month - 1, day);
}

function formatDatabaseDate(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('bg-BG');
}

function formatMoney(value) {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
  }).format(value || 0);
}

function Selector({
  label,
  placeholder,
  options,
  value,
  expanded,
  onToggle,
  onSelect,
}) {
  const selected = options.find(
    (option) => option.value === value
  );

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.selector}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        {selected?.icon && (
          <Ionicons
            name={selected.icon}
            size={21}
            color={colors.primary}
          />
        )}

        <Text
          style={[
            styles.selectorText,
            !selected && styles.placeholder,
          ]}
        >
          {selected?.label || placeholder}
        </Text>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                value === option.value &&
                  styles.selectedOption,
              ]}
              onPress={() => onSelect(option.value)}
            >
              {option.icon && (
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={colors.primary}
                />
              )}

              <Text style={styles.optionText}>
                {option.label}
              </Text>

              {value === option.value && (
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
    </View>
  );
}

export default function ExpenseFormScreen({
  route,
  navigation,
}) {
  const { user } = useAuth();

  const existingExpense = route.params?.expense;
  const isEditing = Boolean(existingExpense);

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] =
    useState(true);

  const [vehicleId, setVehicleId] = useState(
    existingExpense?.vehicle_id ||
      route.params?.vehicleId ||
      ''
  );

  const [category, setCategory] = useState(
    existingExpense?.category || ''
  );

  const [amount, setAmount] = useState(
    existingExpense?.amount != null
      ? String(existingExpense.amount)
      : ''
  );

  const [expenseDate, setExpenseDate] = useState(
    parseLocalDate(existingExpense?.expense_date)
  );

  const [description, setDescription] = useState(
    existingExpense?.description || ''
  );

  const [mileage, setMileage] = useState(
    existingExpense?.mileage != null
      ? String(existingExpense.mileage)
      : ''
  );

  const [fuelType, setFuelType] = useState(
    normalizeFuel(existingExpense?.fuel_type) || ''
  );

  const [liters, setLiters] = useState(
    existingExpense?.liters != null
      ? String(existingExpense.liters)
      : ''
  );

  const [pricePerLiter, setPricePerLiter] = useState(
    existingExpense?.price_per_liter != null
      ? String(existingExpense.price_per_liter)
      : ''
  );

  const [fullTank, setFullTank] = useState(
    existingExpense?.full_tank || false
  );

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [expandedSelector, setExpandedSelector] =
    useState(null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
  });

  const hideAlert = () => {
    setAlert((current) => ({
      ...current,
      visible: false,
    }));
  };

  const showAlert = (
    title,
    message,
    type = 'info',
    onConfirm = null
  ) => {
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
      try {
        if (!user?.id) return;

        const data = await getVehicles(user.id);

        if (!active) return;

        setVehicles(data || []);

        setVehicleId((current) => {
          if (data?.some((vehicle) => vehicle.id === current)) {
            return current;
          }

          return data?.length === 1
            ? data[0].id
            : '';
        });
      } catch (error) {
        if (!active) return;

        console.error('Load vehicles error:', error);

        showAlert(
          'Грешка',
          'Автомобилите не можаха да бъдат заредени.',
          'error'
        );
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

  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.id === vehicleId
  );

  const fuelOptions = getFuelOptions(selectedVehicle);

  const isFuel = category === 'fuel';
  const isElectric = fuelType === 'electric';
  const isCng = fuelType === 'cng';

  const quantityUnit = isElectric
    ? 'kWh'
    : isCng
      ? 'кг'
      : 'л';

  const supportsFullTank = isFuel && !isElectric;

  useEffect(() => {
    if (!selectedVehicle || category !== 'fuel') return;

    const options = getFuelOptions(selectedVehicle);

    setFuelType((current) => {
      if (options.some((item) => item.value === current)) {
        return current;
      }

      return options.length === 1
        ? options[0].value
        : '';
    });
  }, [selectedVehicle, category]);

  const quantityValue = parseDecimal(liters);
  const priceValue = parseDecimal(pricePerLiter);

  const calculatedAmount =
    Number.isFinite(quantityValue) &&
    Number.isFinite(priceValue) &&
    quantityValue > 0 &&
    priceValue > 0
      ? Math.round(
          (quantityValue * priceValue + Number.EPSILON) * 100
        ) / 100
      : 0;

  const vehicleOptions = vehicles.map((vehicle) => ({
    value: vehicle.id,
    label: `${vehicle.brand} ${vehicle.model}${
      vehicle.registration_number
        ? ` (${vehicle.registration_number})`
        : ''
    }`,
    icon: 'car-sport-outline',
  }));

  const toggleSelector = (selector) => {
    setExpandedSelector((current) =>
      current === selector ? null : selector
    );
  };

  const handleVehicleSelect = (value) => {
    setVehicleId(value);
    setFuelType('');
    setExpandedSelector(null);
  };

  const handleCategorySelect = (value) => {
    setCategory(value);
    setExpandedSelector(null);

    if (value !== 'fuel') {
      setFullTank(false);
    }
  };

  const handleFuelSelect = (value) => {
    if (value !== fuelType) {
      setLiters('');
      setPricePerLiter('');
      setFullTank(false);
    }

    setFuelType(value);
    setExpandedSelector(null);
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed') return;

    if (selectedDate) {
      setExpenseDate(selectedDate);
    }
  };

  const validateForm = () => {
    if (!selectedVehicle) {
      return 'Моля, избери автомобил.';
    }

    if (!category) {
      return 'Моля, избери категория.';
    }

    if (isFuel) {
      if (!fuelType) {
        return 'Моля, избери вид гориво.';
      }

      if (
        !Number.isFinite(quantityValue) ||
        quantityValue <= 0 ||
        quantityValue > 9999999.999 ||
        !/^\d+([.,]\d{1,3})?$/.test(liters.trim())
      ) {
        return 'Въведи валидно количество с до три знака след десетичната запетая.';
      }

      if (
        !Number.isFinite(priceValue) ||
        priceValue <= 0 ||
        priceValue > 9999999.999 ||
        !/^\d+([.,]\d{1,3})?$/.test(pricePerLiter.trim())
      ) {
        return 'Въведи валидна единична цена с до три знака след десетичната запетая.';
      }

      if (
        calculatedAmount <= 0 ||
        calculatedAmount > 9999999999.99
      ) {
        return 'Изчислената сума е невалидна.';
      }
    } else {
      const amountValue = parseDecimal(amount);

      if (
        !Number.isFinite(amountValue) ||
        amountValue <= 0 ||
        amountValue > 9999999999.99 ||
        !/^\d+([.,]\d{1,2})?$/.test(amount.trim())
      ) {
        return 'Въведи валидна сума с до два знака след десетичната запетая.';
      }
    }

    if (mileage.trim() !== '') {
      const mileageValue = Number(mileage);

      if (
        !/^\d+$/.test(mileage.trim()) ||
        !Number.isInteger(mileageValue) ||
        mileageValue < 0 ||
        mileageValue > 2147483647
      ) {
        return 'Километражът трябва да бъде валидно цяло положително число или нула.';
      }
    }

    if (
      supportsFullTank &&
      fullTank &&
      mileage.trim() === ''
    ) {
      return 'Въведи километража при зареждане до пълен резервоар.';
    }

    return null;
  };

  const handleSave = async () => {
    if (saving || saved || !user?.id) return;

    const validationError = validateForm();

    if (validationError) {
      showAlert(
        'Невалидни данни',
        validationError,
        'warning'
      );

      return;
    }

    const expenseData = {
      vehicleId,
      category,

      amount: isFuel
        ? calculatedAmount
        : parseDecimal(amount),

      expenseDate: formatDatabaseDate(expenseDate),

      description,

      mileage:
        mileage.trim() === ''
          ? null
          : Number(mileage),

      fuelType: isFuel ? fuelType : null,

      liters: isFuel ? quantityValue : null,

      pricePerLiter: isFuel ? priceValue : null,

      fullTank: supportsFullTank
        ? fullTank
        : false,
    };

    try {
      setSaving(true);

      if (isEditing) {
        await updateExpense(
          existingExpense.id,
          expenseData,
          user.id
        );
      } else {
        await createExpense(expenseData, user.id);
      }

      setSaved(true);

      showAlert(
        'Успешен запис',
        isEditing
          ? 'Разходът беше актуализиран успешно.'
          : 'Разходът беше добавен успешно.',
        'success',
        () => {
          hideAlert();
          navigation.goBack();
        }
      );
    } catch (error) {
      console.error('Save expense error:', error);

      showAlert(
        'Грешка при записване',
        error.message ||
          'Разходът не можа да бъде записан.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
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
              disabled={saving || saved}
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
                {isEditing
                  ? 'Редактирай разход'
                  : 'Добави разход'}
              </Text>
            </View>
          </View>

          {loadingVehicles ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loader}
            />
          ) : vehicles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="car-outline"
                size={42}
                color={colors.primary}
              />

              <Text style={styles.emptyTitle}>
                Няма налични автомобили
              </Text>

              <Text style={styles.emptyDescription}>
                За да добавиш разход, първо трябва да
                добавиш автомобил в гаража.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>
                  Основна информация
                </Text>

                <Selector
                  label="Автомобил *"
                  placeholder="Избери автомобил"
                  options={vehicleOptions}
                  value={vehicleId}
                  expanded={expandedSelector === 'vehicle'}
                  onToggle={() => toggleSelector('vehicle')}
                  onSelect={handleVehicleSelect}
                />

                <Selector
                  label="Категория *"
                  placeholder="Избери категория"
                  options={CATEGORIES}
                  value={category}
                  expanded={expandedSelector === 'category'}
                  onToggle={() => toggleSelector('category')}
                  onSelect={handleCategorySelect}
                />

                <View style={styles.field}>
                  <Text style={styles.label}>
                    Дата на разхода *
                  </Text>

                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={21}
                      color={colors.primary}
                    />

                    <Text style={styles.selectorText}>
                      {formatDisplayDate(expenseDate)}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <>
                      <DateTimePicker
                        value={expenseDate}
                        mode="date"
                        display="default"
                        maximumDate={new Date()}
                        onChange={handleDateChange}
                      />

                      {Platform.OS === 'ios' && (
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(false)}
                        >
                          <Text style={styles.doneText}>
                            Готово
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              </View>

              {isFuel ? (
                <View style={styles.formCard}>
                  <Text style={styles.sectionTitle}>
                    Зареждане
                  </Text>

                  <Selector
                    label="Вид гориво *"
                    placeholder="Избери вид гориво"
                    options={fuelOptions}
                    value={fuelType}
                    expanded={expandedSelector === 'fuel'}
                    onToggle={() => toggleSelector('fuel')}
                    onSelect={handleFuelSelect}
                  />

                  <View style={styles.inputRow}>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>
                        Количество ({quantityUnit}) *
                      </Text>

                      <TextInput
                        style={styles.input}
                        value={liters}
                        onChangeText={setLiters}
                        placeholder="0,00"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="decimal-pad"
                      />
                    </View>

                    <View style={styles.halfField}>
                      <Text style={styles.label}>
                        Цена (€/{quantityUnit}) *
                      </Text>

                      <TextInput
                        style={styles.input}
                        value={pricePerLiter}
                        onChangeText={setPricePerLiter}
                        placeholder="0,00"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.calculatedCard}>
                    <Text style={styles.calculatedLabel}>
                      ОБЩА СУМА
                    </Text>

                    <Text style={styles.calculatedAmount}>
                      {formatMoney(calculatedAmount)}
                    </Text>

                    <Text style={styles.helperText}>
                      Сумата се изчислява автоматично.
                    </Text>
                  </View>

                  {supportsFullTank && (
                    <View style={styles.switchRow}>
                      <View style={styles.switchText}>
                        <Text style={styles.switchTitle}>
                          Пълен резервоар
                        </Text>

                        <Text style={styles.helperText}>
                          За изчисляване на средния разход
                          на гориво.
                        </Text>
                      </View>

                      <Switch
                        value={fullTank}
                        onValueChange={setFullTank}
                        trackColor={{
                          false: colors.border,
                          true: colors.primary,
                        }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.formCard}>
                  <Text style={styles.sectionTitle}>
                    Финансова информация
                  </Text>

                  <View style={styles.field}>
                    <Text style={styles.label}>
                      Сума (€) *
                    </Text>

                    <TextInput
                      style={styles.input}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="0,00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  {category === 'repairs' && (
                    <View style={styles.infoBox}>
                      <Ionicons
                        name="information-circle-outline"
                        size={23}
                        color={colors.primary}
                      />

                      <Text style={styles.infoText}>
                        Разходите от сервизната история
                        се отчитат автоматично. Не ги
                        въвеждай повторно тук.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>
                  Допълнителна информация
                </Text>

                <View style={styles.field}>
                  <Text style={styles.label}>
                    Километраж (км)
                    {supportsFullTank && fullTank ? ' *' : ''}
                  </Text>

                  <TextInput
                    style={styles.input}
                    value={mileage}
                    onChangeText={setMileage}
                    placeholder={
                      selectedVehicle?.mileage != null
                        ? String(selectedVehicle.mileage)
                        : 'Въведи километраж'
                    }
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                  />

                  {selectedVehicle?.mileage != null && (
                    <TouchableOpacity
                      onPress={() =>
                        setMileage(String(selectedVehicle.mileage))
                      }
                    >
                      <Text style={styles.useMileageText}>
                        Използвай текущия километраж
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>
                    Описание
                  </Text>

                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Допълнителна информация за разхода..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (saving || saved) && styles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={saving || saved}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={23}
                      color="#FFFFFF"
                    />

                    <Text style={styles.saveButtonText}>
                      {isEditing
                        ? 'Запази промените'
                        : 'Запази разхода'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        confirmText="Разбрах"
        onConfirm={alert.onConfirm || hideAlert}
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
    fontSize: 25,
    fontWeight: '700',
  },

  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: 18,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },

  field: {
    gap: 8,
  },

  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },

  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 50,
  },

  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 52,
    gap: 10,
  },

  selectorText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },

  placeholder: {
    color: colors.textSecondary,
  },

  optionsContainer: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 5,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    gap: 10,
    borderRadius: 8,
  },

  selectedOption: {
    backgroundColor: `${colors.primary}20`,
  },

  optionText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },

  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },

  halfField: {
    flex: 1,
    gap: 8,
  },

  calculatedCard: {
    backgroundColor: `${colors.primary}12`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
    borderRadius: 14,
    padding: spacing.lg,
    gap: 8,
  },

  calculatedLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },

  calculatedAmount: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '800',
  },

  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  switchText: {
    flex: 1,
    gap: 5,
  },

  switchTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },

  textArea: {
    minHeight: 110,
  },

  useMileageText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    paddingVertical: 4,
  },

  doneText: {
    color: colors.primary,
    textAlign: 'right',
    fontWeight: '600',
    padding: 8,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}12`,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },

  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },

  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    minHeight: 56,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  disabledButton: {
    opacity: 0.5,
  },

  loader: {
    marginTop: 40,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 12,
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
});
