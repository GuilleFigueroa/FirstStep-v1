-- Migration: Agregar columna lemon_subscription_id a profiles
-- Fecha: 2024-12-10
-- Propósito: Almacenar el ID de suscripción de Lemon Squeezy

-- Agregar columna lemon_subscription_id
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS lemon_subscription_id TEXT;

-- Crear índice para búsquedas rápidas por lemon_subscription_id
CREATE INDEX IF NOT EXISTS idx_profiles_lemon_subscription_id
ON profiles(lemon_subscription_id);

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'lemon_subscription_id';
