-- ============================================================
--  Crea el usuario administrador
--  Ejecutar en: Supabase > SQL Editor > New Query
--  Email:       graciad903@gmail.com
--  Contraseña:  Diego321
-- ============================================================

DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN

  -- 1. Insertar el usuario en auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    role,
    aud,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'graciad903@gmail.com',
    crypt('Diego321', gen_salt('bf')),
    NOW(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}',
    '{"name":"Admin"}',
    NOW(),
    NOW()
  );

  -- 2. Crear la identidad vinculada (requerido en Supabase moderno)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    new_user_id::TEXT,
    json_build_object('sub', new_user_id::TEXT, 'email', 'graciad903@gmail.com')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );

END $$;

-- Verifica que se creó correctamente
SELECT id, email, created_at FROM auth.users WHERE email = 'graciad903@gmail.com';
