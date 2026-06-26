-- ============================================================
-- PERFIL DO ADMINISTRADOR
-- ============================================================

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS avatar_path TEXT;

-- Garante updated_at caso a tabela já tenha sido criada anteriormente.
ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Bucket para avatares.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'admin-avatars',
  'admin-avatars',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- O upload será feito exclusivamente pelo servidor usando service role.
-- Por isso, não criamos policies públicas de INSERT/UPDATE/DELETE.