
import { supabase } from './supabase';

// Добавяне на автомобил
export async function createVehicle(vehicle, userId) {
  const vehicleData = {
    user_id: userId,
    brand: vehicle.brand.trim(),
    model: vehicle.model.trim(),
    year: Number(vehicle.year),
    registration_number: vehicle.registrationNumber.trim().toUpperCase(),
    vin: vehicle.vin.trim() || null,
    primary_fuel: vehicle.primaryFuel,
    additional_fuel: vehicle.additionalFuel,
    engine: vehicle.engine.trim() || null,
    mileage: Number(vehicle.mileage),
    image_url: null,
  };

  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicleData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Зареждане на автомобилите на потребителя
export async function getVehicles(userId) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
