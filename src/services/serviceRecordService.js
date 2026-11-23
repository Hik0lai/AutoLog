
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


export async function getServiceRecords(vehicleId) {
  if (!vehicleId) {
    throw new Error('Не е избран автомобил.');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Необходимо е да влезете в профила си.');
  }

  const { data, error } = await supabase
    .from('service_records')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('user_id', user.id)
    .order('service_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Грешка при зареждане на обслужванията:', error);
    throw error;
  }

  return data || [];
}


export async function updateServiceRecord(recordId, formData) {
  if (!recordId) {
    throw new Error('Не е избрано обслужване.');
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

  const updates = {
    category: formData.serviceType,
    title: formData.title,
    service_date: formData.date,
    mileage,
    description: formData.description?.trim() || null,
    cost,
  };

  const { data, error } = await supabase
    .from('service_records')
    .update(updates)
    .eq('id', recordId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Грешка при редактиране на обслужване:', error);
    throw error;
  }

  return data;
}


export async function deleteServiceRecord(recordId) {
  if (!recordId) {
    throw new Error('Не е избрано обслужване.');
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Необходимо е да влезете в профила си.');
  }

  const { data, error } = await supabase
    .from('service_records')
    .delete()
    .eq('id', recordId)
    .eq('user_id', user.id)
    .select('id');

  if (error) {
    console.error('Грешка при изтриване на обслужване:', error);
    throw error;
  }

  if (!data?.length) {
    throw new Error('Обслужването не е намерено или вече е изтрито.');
  }

  return true;
}



