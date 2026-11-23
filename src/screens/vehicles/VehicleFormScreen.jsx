
import { useEffect, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../constants/colors';
import spacing from '../../constants/spacing';
import typography from '../../constants/typography';

import { useAuth } from '../../context/AuthContext';

import {
  createVehicle,
  updateVehicle,
  uploadVehicleImage,
} from '../../services/vehicleService';

import { supabase } from '../../services/supabase';
import CustomAlert from '../../components/common/CustomAlert';

const primaryFuelTypes = [
  'Бензин',
  'Дизел',
  'Хибрид',
  'Електрически',
];

const additionalFuelTypes = [
  { label: 'Няма', value: 'none' },
  { label: 'LPG - пропан-бутан', value: 'lpg' },
  { label: 'CNG - метан', value: 'cng' },
];

export default function VehicleFormScreen({ route, navigation }) {
  const { user } = useAuth();

  const vehicle = route.params?.vehicle;
  const isEditing = Boolean(vehicle?.id);

  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year != null ? String(vehicle.year) : '',
    registrationNumber: vehicle?.registration_number || '',
    vin: vehicle?.vin || '',
    primaryFuel: vehicle?.primary_fuel || 'Бензин',
    additionalFuel: vehicle?.additional_fuel || 'none',
    engine: vehicle?.engine || '',
    mileage: vehicle?.mileage != null
      ? String(vehicle.mileage)
      : '',
  });

  const [errors, setErrors] = useState({});

  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'Разбрах',
    onConfirm: null,
  });

  useEffect(() => {
    let active = true;

    async function loadExistingImage() {
      if (!isEditing || !vehicle?.image_url) {
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
          setImageUri(data.signedUrl);
        }
      } catch (error) {
        console.error(
          'Грешка при зареждане на снимката:',
          error
        );
      } finally {
        if (active) {
          setImageLoading(false);
        }
      }
    }

    loadExistingImage();

    return () => {
      active = false;
    };
  }, [isEditing, vehicle?.image_url]);

  const updateField = (field, value) => {
    setForm(previous => ({
      ...previous,
      [field]: value,
    }));

    setErrors(previous => ({
      ...previous,
      [field]: '',
    }));
  };

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
    onConfirm,
  }) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
      confirmText,
      onConfirm,
    });
  };

  const selectImage = async () => {
    if (loading) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showAlert({
          title: 'Необходим достъп',
          message:
            'Разреши достъп до галерията, за да избереш снимка.',
          type: 'warning',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];

        if (!asset.base64) {
          throw new Error(
            'Неуспешно прочитане на снимката. Опитай отново.'
          );
        }

        setImageUri(asset.uri);
        setImageBase64(asset.base64);
        setImageRemoved(false);
      }
    } catch (error) {
      showAlert({
        title: 'Грешка',
        message: error.message,
        type: 'error',
      });
    }
  };

  const removeImage = () => {
    setImageUri(null);
    setImageBase64(null);
    setImageRemoved(true);
  };

  const validateForm = () => {
    const newErrors = {};
    const currentYear = new Date().getFullYear();

    if (!form.brand.trim()) {
      newErrors.brand = 'Въведи марка.';
    }

    if (!form.model.trim()) {
      newErrors.model = 'Въведи модел.';
    }

    const year = Number(form.year);

    if (!form.year.trim()) {
      newErrors.year = 'Въведи година.';
    } else if (
      !Number.isInteger(year) ||
      year < 1900 ||
      year > currentYear + 1
    ) {
      newErrors.year = 'Въведи валидна година.';
    }

    if (!form.registrationNumber.trim()) {
      newErrors.registrationNumber =
        'Въведи регистрационен номер.';
    }

    if (!form.mileage.trim()) {
      newErrors.mileage = 'Въведи текущ километраж.';
    } else if (
      !Number.isInteger(Number(form.mileage)) ||
      Number(form.mileage) < 0
    ) {
      newErrors.mileage =
        'Километражът трябва да е цяло положително число.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (loading) return;

    if (!validateForm()) {
      showAlert({
        title: 'Невалидни данни',
        message: 'Моля, провери задължителните полета.',
        type: 'warning',
      });
      return;
    }

    if (!user) {
      showAlert({
        title: 'Няма активна сесия',
        message: 'Моля, влез отново в профила си.',
        type: 'error',
      });
      return;
    }

    try {
      setLoading(true);

      let imageUrl = isEditing
        ? vehicle.image_url || null
        : null;

      if (imageRemoved) {
        imageUrl = null;
      }

      // Качваме снимка само ако е избрана нова.
      if (imageBase64 && imageUri) {
        imageUrl = await uploadVehicleImage(
          imageBase64,
          user.id,
          imageUri
        );
      }

      const vehicleData = {
        ...form,
        imageUrl,
      };

      if (isEditing) {
        await updateVehicle(
          vehicle.id,
          vehicleData,
          user.id
        );

        showAlert({
          title: 'Успешна редакция',
          message:
            'Промените по автомобила бяха запазени успешно.',
          type: 'success',
          confirmText: 'Към автомобила',
          onConfirm: () => {
            hideAlert();
            navigation.goBack();
          },
        });
      } else {
        await createVehicle(vehicleData, user.id);

        showAlert({
          title: 'Успешно добавяне',
          message:
            'Автомобилът беше добавен в твоя гараж.',
          type: 'success',
          confirmText: 'Към гаража',
          onConfirm: () => {
            hideAlert();
            navigation.goBack();
          },
        });
      }
    } catch (error) {
      let message =
        error.message || 'Възникна грешка при записване.';

      if (error.code === '23505') {
        message =
          'Автомобил с този регистрационен номер или VIN вече съществува.';
      }

      showAlert({
        title: 'Грешка при записване',
        message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label,
    field,
    placeholder,
    options = {}
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {options.required ? ' *' : ''}
      </Text>

      <TextInput
        style={[
          styles.input,
          errors[field] && styles.inputError,
        ]}
        value={form[field]}
        onChangeText={value => updateField(field, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={options.keyboardType || 'default'}
        autoCapitalize={options.autoCapitalize || 'sentences'}
        maxLength={options.maxLength}
        editable={!loading}
      />

      {errors[field] ? (
        <Text style={styles.errorText}>
          {errors[field]}
        </Text>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            disabled={loading}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color={colors.text}
            />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {isEditing
                ? 'Редактиране на автомобил'
                : 'Нов автомобил'}
            </Text>

            <Text style={styles.headerSubtitle}>
              {isEditing
                ? 'Промени данните на автомобила'
                : 'Добави автомобил в своя гараж'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Снимка на автомобила
        </Text>

        <TouchableOpacity
          style={styles.imageContainer}
          onPress={selectImage}
          activeOpacity={0.85}
          disabled={loading || imageLoading}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.vehicleImage}
            />
          ) : imageLoading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="car-sport-outline"
                size={64}
                color={colors.primary}
              />

              <Text style={styles.imageTitle}>
                Добави снимка на автомобила
              </Text>

              <Text style={styles.imageSubtitle}>
                Избери изображение от галерията
              </Text>
            </View>
          )}

          <View style={styles.imageButton}>
            <Ionicons
              name="camera-outline"
              size={20}
              color={colors.background}
            />

            <Text style={styles.imageButtonText}>
              {imageUri ? 'Смени снимката' : 'Добави снимка'}
            </Text>
          </View>
        </TouchableOpacity>

        {imageUri ? (
          <TouchableOpacity
            onPress={removeImage}
            style={styles.removeImageButton}
            disabled={loading}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={colors.danger}
            />

            <Text style={styles.removeImageText}>
              Премахни снимката
            </Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.sectionTitle}>
          Основна информация
        </Text>

        {renderInput('Марка', 'brand', 'Например Audi', {
          required: true,
        })}

        {renderInput('Модел', 'model', 'Например A4', {
          required: true,
        })}

        {renderInput('Година', 'year', 'Например 2005', {
          required: true,
          keyboardType: 'numeric',
          maxLength: 4,
        })}

        {renderInput(
          'Регистрационен номер',
          'registrationNumber',
          'Например CB1234AB',
          {
            required: true,
            autoCapitalize: 'characters',
            maxLength: 12,
          }
        )}

        {renderInput(
          'VIN номер',
          'vin',
          '17 символа (незадължително)',
          {
            autoCapitalize: 'characters',
            maxLength: 17,
          }
        )}

        <Text style={styles.sectionTitle}>
          Технически данни
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Основно гориво *
          </Text>

          <View style={styles.fuelContainer}>
            {primaryFuelTypes.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.fuelOption,
                  form.primaryFuel === type &&
                    styles.fuelOptionSelected,
                ]}
                onPress={() => updateField('primaryFuel', type)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.fuelText,
                    form.primaryFuel === type &&
                      styles.fuelTextSelected,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Допълнителна горивна система
          </Text>

          <View style={styles.fuelContainer}>
            {additionalFuelTypes.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.fuelOption,
                  form.additionalFuel === option.value &&
                    styles.fuelOptionSelected,
                ]}
                onPress={() =>
                  updateField('additionalFuel', option.value)
                }
                disabled={loading}
              >
                <Text
                  style={[
                    styles.fuelText,
                    form.additionalFuel === option.value &&
                      styles.fuelTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {renderInput(
          'Двигател',
          'engine',
          'Например 2.0 TDI (незадължително)'
        )}

        {renderInput(
          'Текущ километраж',
          'mileage',
          'Например 245000',
          {
            required: true,
            keyboardType: 'numeric',
          }
        )}

        <Text style={styles.requiredInfo}>
          * Задължителни полета
        </Text>

        <TouchableOpacity
          style={[
            styles.saveButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color={colors.background}
              />

              <Text style={styles.saveButtonText}>
                {isEditing
                  ? 'Запази промените'
                  : 'Запази автомобила'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        confirmText={alert.confirmText}
        onConfirm={alert.onConfirm || hideAlert}
      />
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: '700',
  },

  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: 3,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  imageContainer: {
    height: 210,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingBottom: 45,
    paddingHorizontal: spacing.md,
  },

  vehicleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  imageTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center',
  },

  imageSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  imageButton: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    gap: spacing.sm,
  },

  imageButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
  },

  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },

  removeImageText: {
    color: colors.danger,
    fontSize: typography.sizes.sm,
  },

  inputGroup: {
    marginBottom: spacing.md,
  },

  label: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: '600',
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
  },

  inputError: {
    borderColor: colors.danger,
  },

  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },

  fuelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  fuelOption: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  fuelOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  fuelText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },

  fuelTextSelected: {
    color: colors.background,
    fontWeight: '700',
  },

  requiredInfo: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.md,
  },

  saveButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '700',
  },
});
