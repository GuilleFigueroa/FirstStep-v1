-- Migration: Agregar columna lemon_customer_id a profiles
-- Fecha: 2026-01-23
-- Propósito: Almacenar el Customer ID de Lemon Squeezy para identificar usuarios en renovaciones
-- El customer_id nunca cambia aunque la suscripción se renueve o cancele

-- Agregar columna lemon_customer_id
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS lemon_customer_id TEXT;

-- Crear índice para búsquedas rápidas por lemon_customer_id
CREATE INDEX IF NOT EXISTS idx_profiles_lemon_customer_id
ON profiles(lemon_customer_id);

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'lemon_customer_id';
