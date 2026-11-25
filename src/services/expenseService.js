
import { supabase } from './supabase';

const VEHICLE_SELECT = `
  *,
  vehicle:vehicles (
    id,
    brand,
    model,
    registration_number,
    mileage
  )
`;

// Подготовка на данните за запис.
function prepareExpenseData(expense) {
  const isFuel = expense.category === 'fuel';

  return {
    vehicle_id: expense.vehicleId,
    category: expense.category,
    amount: Number(expense.amount),
    expense_date: expense.expenseDate,

    description: expense.description?.trim() || null,

    mileage:
      expense.mileage === '' || expense.mileage == null
        ? null
        : Number(expense.mileage),

    fuel_type: isFuel
      ? expense.fuelType || null
      : null,

    liters:
      isFuel && expense.liters != null && expense.liters !== ''
        ? Number(expense.liters)
        : null,

    price_per_liter:
      isFuel &&
      expense.pricePerLiter != null &&
      expense.pricePerLiter !== ''
        ? Number(expense.pricePerLiter)
        : null,

    full_tank: isFuel
      ? Boolean(expense.fullTank)
      : false,
  };
}

// Извличане на всички разходи на потребителя.
export async function getExpenses(userId) {
  const { data, error } = await supabase
    .from('expenses')
    .select(VEHICLE_SELECT)
    .eq('user_id', userId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get expenses error:', error);
    throw error;
  }

  return data;
}

// Извличане на конкретен разход.
export async function getExpenseById(expenseId, userId) {
  const { data, error } = await supabase
    .from('expenses')
    .select(VEHICLE_SELECT)
    .eq('id', expenseId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Get expense error:', error);
    throw error;
  }

  return data;
}

// Извличане на разходите за конкретен автомобил.
export async function getVehicleExpenses(vehicleId, userId) {
  const { data, error } = await supabase
    .from('expenses')
    .select(VEHICLE_SELECT)
    .eq('vehicle_id', vehicleId)
    .eq('user_id', userId)
    .order('expense_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get vehicle expenses error:', error);
    throw error;
  }

  return data;
}

// Създаване на нов разход.
export async function createExpense(expense, userId) {
  const expenseData = {
    ...prepareExpenseData(expense),
    user_id: userId,
  };

  const { data, error } = await supabase
    .from('expenses')
    .insert(expenseData)
    .select()
    .single();

  if (error) {
    console.error('Create expense error:', error);
    throw error;
  }

  return data;
}

// Редактиране на съществуващ разход.
export async function updateExpense(
  expenseId,
  expense,
  userId
) {
  const expenseData = prepareExpenseData(expense);

  const { data, error } = await supabase
    .from('expenses')
    .update(expenseData)
    .eq('id', expenseId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Update expense error:', error);
    throw error;
  }

  return data;
}

// Изтриване на разход.
export async function deleteExpense(expenseId, userId) {
  const { data, error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('user_id', userId)
    .select('id')
    .single();

  if (error) {
    console.error('Delete expense error:', error);
    throw error;
  }

  return data;
}

// Обединяване на обикновените и сервизните разходи.
export async function getCombinedExpenses(userId) {
  const [expenses, serviceResult] = await Promise.all([
    getExpenses(userId),

    supabase
      .from('service_records')
      .select(VEHICLE_SELECT)
      .eq('user_id', userId)
      .gt('cost', 0)
      .order('service_date', { ascending: false }),
  ]);

  if (serviceResult.error) {
    console.error(
      'Get service expenses error:',
      serviceResult.error
    );

    throw serviceResult.error;
  }

  const regularExpenses = expenses.map((expense) => ({
    ...expense,
    amount: Number(expense.amount),
    source: 'expense',
    uniqueKey: `expense-${expense.id}`,
  }));

  const serviceExpenses = serviceResult.data.map(
    (record) => ({
      id: record.id,
      user_id: record.user_id,
      vehicle_id: record.vehicle_id,

      category: 'repairs',
      title: record.title,
      service_category: record.category,

      amount: Number(record.cost),
      expense_date: record.service_date,
      description: record.description,
      mileage: record.mileage,

      fuel_type: null,
      liters: null,
      price_per_liter: null,
      full_tank: false,

      vehicle: record.vehicle,
      created_at: record.created_at,
      updated_at: record.updated_at,

      source: 'service',
      uniqueKey: `service-${record.id}`,
    })
  );

  return [...regularExpenses, ...serviceExpenses].sort(
    (a, b) =>
      b.expense_date.localeCompare(a.expense_date) ||
      new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
  );
}
