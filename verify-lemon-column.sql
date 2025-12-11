-- Verificar que la columna lemon_subscription_id existe
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND column_name = 'lemon_subscription_id';

-- Verificar que el índice existe
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
    AND indexname = 'idx_profiles_lemon_subscription_id';

-- Ver todas las columnas de profiles (opcional, para contexto completo)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
