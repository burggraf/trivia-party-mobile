-- Run this in Supabase SQL Editor to check your existing questions table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'questions' 
AND table_schema = 'public'
ORDER BY ordinal_position;