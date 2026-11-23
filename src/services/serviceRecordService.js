
import { supabase } from './supabase';

export async function createServiceRecord(vehicle, formData) {
  if (!vehicle?.id) {
    throw new Error('Не е избран автомобил.');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Необходимо е да влезете в профила си.');
  }

  const mileage = Number(formData.mileage);
  const cost = Number(
    String(formData.cost || '0').replace(',', '.')
  );

  if (!Number.isInteger(mileage) || mileage < 0) {
    throw new Error('Въведете валиден пробег.');
  }

  if (!Number.isFinite(cost) || cost < 0) {
    throw new Error('Въведете валидна стойност.');
  }

  const record = {
    user_id: user.id,
    vehicle_id: vehicle.id,
    category: formData.serviceType,
    title: formData.title,
    service_date: formData.date,
    mileage,
    description: formData.description?.trim() || null,
    cost,
  };

  const { data, error } = await supabase
    .from('service_records')
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error('Грешка при запис на обслужване:', error);
    throw error;
  }

  return data;
}
