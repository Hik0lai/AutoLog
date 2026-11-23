
import { decode } from 'base64-arraybuffer';

import { supabase } from './supabase';

// Качване на снимка в Supabase Storage
export async function uploadVehicleImage(imageBase64, userId, imageUri) {
  try {
    if (!imageBase64) {
      throw new Error('Липсват данни за снимката.');
    }

    // Декодиране на Base64 до реални байтове
    const arrayBuffer = decode(imageBase64);

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error(
        'Снимката е празна или не може да бъде прочетена.'
      );
    }

    // Определяне на разширението на файла
    const extension =
      imageUri
        ?.split('?')[0]
        .split('.')
        .pop()
        ?.toLowerCase() || 'jpg';

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic'];

    const fileExtension = allowedExtensions.includes(extension)
      ? extension
      : 'jpg';

    // Определяне на MIME типа
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      heic: 'image/heic',
    };

    const contentType = mimeTypes[fileExtension];

    // Създаване на уникален път за файла
    const fileName = `${Date.now()}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    // Качване в Supabase Storage
    const { data, error } = await supabase.storage
      .from('vehicle-images')
      .upload(filePath, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw error;
    }

    console.log(
      'Vehicle image uploaded:',
      data.path,
      'Size:',
      arrayBuffer.byteLength,
      'bytes'
    );

    return data.path;
  } catch (error) {
    console.error('Vehicle image upload error:', error);
    throw error;
  }
}

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
    image_url: vehicle.imageUrl || null,
  };

  const { data, error } = await supabase
    .from('vehicles')
    .insert(vehicleData)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// Зареждане на автомобилите
export async function getVehicles(userId) {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data;
}


export async function updateVehicle(vehicleId, vehicle, userId) {
  if (!vehicleId) {
    throw new Error('Не е избран автомобил.');
  }

  if (!userId) {
    throw new Error('Няма активна потребителска сесия.');
  }

  const vehicleData = {
    brand: vehicle.brand.trim(),
    model: vehicle.model.trim(),
    year: Number(vehicle.year),
    registration_number: vehicle.registrationNumber
      .trim()
      .toUpperCase(),
    vin: vehicle.vin.trim() || null,
    primary_fuel: vehicle.primaryFuel,
    additional_fuel: vehicle.additionalFuel,
    engine: vehicle.engine.trim() || null,
    mileage: Number(vehicle.mileage),
    image_url: vehicle.imageUrl || null,
  };

  const { data, error } = await supabase
    .from('vehicles')
    .update(vehicleData)
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Vehicle update error:', error);
    throw error;
  }

  return data;
}


export async function getVehicleById(vehicleId, userId) {
  if (!vehicleId || !userId) {
    throw new Error('Липсва автомобил или потребител.');
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Vehicle fetch error:', error);
    throw error;
  }

  return data;
}


