
import { supabase } from './supabase';

// Подготовка на данните за запис в Supabase.
function prepareReminderData(reminder) {
  return {
    vehicle_id: reminder.vehicleId,
    category: reminder.category,
    title: reminder.title.trim(),
    description: reminder.description?.trim() || null,

    due_date: reminder.dueDate || null,

    due_mileage:
      reminder.dueMileage === '' ||
      reminder.dueMileage == null
        ? null
        : Number(reminder.dueMileage),

    notify_days_before: Number(
      reminder.notifyDaysBefore ?? 7
    ),

    notify_km_before: Number(
      reminder.notifyKmBefore ?? 500
    ),

    notifications_enabled:
      reminder.notificationsEnabled ?? true,
  };
}

// Извличане на всички напомняния на потребителя.
export async function getReminders(userId) {
  const { data, error } = await supabase
    .from('reminders')
    .select(`
      *,
      vehicle:vehicles (
        id,
        brand,
        model,
        registration_number,
        mileage
      )
    `)
    .eq('user_id', userId)
    .order('is_completed', { ascending: true })
    .order('due_date', {
      ascending: true,
      nullsFirst: false,
    })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get reminders error:', error);
    throw error;
  }

  return data;
}

// Извличане на конкретно напомняне.
export async function getReminderById(
  reminderId,
  userId
) {
  const { data, error } = await supabase
    .from('reminders')
    .select(`
      *,
      vehicle:vehicles (
        id,
        brand,
        model,
        registration_number,
        mileage
      )
    `)
    .eq('id', reminderId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Get reminder error:', error);
    throw error;
  }

  return data;
}

// Извличане на напомняния за конкретен автомобил.
export async function getVehicleReminders(
  vehicleId,
  userId
) {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('user_id', userId)
    .order('is_completed', { ascending: true })
    .order('due_date', {
      ascending: true,
      nullsFirst: false,
    })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get vehicle reminders error:', error);
    throw error;
  }

  return data;
}

// Създаване на ново напомняне.
export async function createReminder(reminder, userId) {
  const reminderData = {
    ...prepareReminderData(reminder),
    user_id: userId,
    is_completed: false,
    completed_at: null,
  };

  const { data, error } = await supabase
    .from('reminders')
    .insert(reminderData)
    .select()
    .single();

  if (error) {
    console.error('Create reminder error:', error);
    throw error;
  }

  return data;
}

// Редактиране на съществуващо напомняне.
export async function updateReminder(
  reminderId,
  reminder,
  userId
) {
  const reminderData = prepareReminderData(reminder);

  const { data, error } = await supabase
    .from('reminders')
    .update(reminderData)
    .eq('id', reminderId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Update reminder error:', error);
    throw error;
  }

  return data;
}

// Маркиране като изпълнено или неизпълнено.
export async function setReminderCompleted(
  reminderId,
  isCompleted,
  userId
) {
  const { data, error } = await supabase
    .from('reminders')
    .update({
      is_completed: isCompleted,
      completed_at: isCompleted
        ? new Date().toISOString()
        : null,
    })
    .eq('id', reminderId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Complete reminder error:', error);
    throw error;
  }

  return data;
}

// Изтриване на напомняне.
export async function deleteReminder(
  reminderId,
  userId
) {
  const { data, error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', reminderId)
    .eq('user_id', userId)
    .select('id')
    .single();

  if (error) {
    console.error('Delete reminder error:', error);
    throw error;
  }

  return data;
}
