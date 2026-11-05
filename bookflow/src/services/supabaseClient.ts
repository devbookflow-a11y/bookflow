/**
 * @file supabaseClient.ts
 * @description Gerenciamento de cliente, credenciais e verificação de conexão com o Supabase.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_SUPABASE = 'bookflow_supabase_config_v1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'hardcoded' | 'none';
}

/**
 * Normaliza e higieniza uma URL do Supabase para garantir formato estrito:
 * - Remove espaços e aspas acidentais
 * - Adiciona https:// caso o usuário tenha colado apenas 'xyz.supabase.co'
 * - Remove caminhos adicionais como /auth/v1, /rest/v1 ou barras finais ('/')
 *   que causam o erro Kong/Supabase: "Invalid path specified in request URL"
 */
export function sanitizeSupabaseUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  let cleaned = rawUrl.trim().replace(/^["']|["']$/g, '').trim();
  if (
    !cleaned ||
    cleaned.includes('your-project.supabase.co') ||
    cleaned === 'MY_APP_URL'
  ) {
    return null;
  }

  // Se não começar com protocolo, assume https://
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);
    // Garante APENAS a origem (protocolo + hostname + porta se houver), SEM sub-caminhos e SEM barra final
    // Ex: "https://xyz.supabase.co/" -> "https://xyz.supabase.co"
    // Ex: "https://xyz.supabase.co/auth/v1/signup" -> "https://xyz.supabase.co"
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

/**
 * Valida e higieniza a Chave Anon (JWT) do Supabase
 */
export function sanitizeSupabaseKey(rawKey?: string | null): string | null {
  if (!rawKey) return null;
  const cleaned = rawKey.trim().replace(/^["']|["']$/g, '').trim();
  if (
    !cleaned ||
    cleaned === 'your-anon-key' ||
    cleaned === 'MY_SUPABASE_KEY' ||
    cleaned.length < 15
  ) {
    return null;
  }
  return cleaned;
}

/**
 * Constantes opcionais caso o desenvolvedor prefira fixar as credenciais diretamente no código:
 */
const HARDCODED_SUPABASE_URL = '';
const HARDCODED_SUPABASE_ANON_KEY = '';

/**
 * Carrega a configuração ativa do Supabase com validação e sanitização estritas
 */
export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = sanitizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
  const envKey = sanitizeSupabaseKey(import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (envUrl && envKey) {
    return {
      url: envUrl,
      anonKey: envKey,
      isConfigured: true,
      source: 'env',
    };
  }

  const hardcodedUrl = sanitizeSupabaseUrl(HARDCODED_SUPABASE_URL);
  const hardcodedKey = sanitizeSupabaseKey(HARDCODED_SUPABASE_ANON_KEY);

  if (hardcodedUrl && hardcodedKey) {
    return {
      url: hardcodedUrl,
      anonKey: hardcodedKey,
      isConfigured: true,
      source: 'hardcoded',
    };
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'none',
  };
}

let cachedClient: SupabaseClient | null = null;
let lastUsedConfigSignature = '';

/**
 * Retorna a instância única e higienizada do cliente Supabase ou null se não configurado
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.anonKey) {
    cachedClient = null;
    lastUsedConfigSignature = '';
    return null;
  }

  const currentSignature = `${config.url}::${config.anonKey}`;
  if (cachedClient && lastUsedConfigSignature === currentSignature) {
    return cachedClient;
  }

  try {
    // createClient recebe a URL estritamente limpa (origem sem caminhos residuais como /auth/v1)
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    lastUsedConfigSignature = currentSignature;
    return cachedClient;
  } catch (error) {
    console.error('[Supabase] Falha ao inicializar SupabaseClient:', error);
    cachedClient = null;
    lastUsedConfigSignature = '';
    return null;
  }
}

/**
 * Testa a conexão com uma URL e Chave Anon do Supabase com sanitização prévia
 */
export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> {
  const cleanUrl = sanitizeSupabaseUrl(url);
  const cleanKey = sanitizeSupabaseKey(anonKey);

  if (!cleanUrl || !cleanKey) {
    return {
      success: false,
      message: 'URL ou Chave Anon inválidas. Certifique-se de usar o formato https://seu-projeto.supabase.co sem barras adicionais.',
    };
  }

  try {
    const testClient = createClient(cleanUrl, cleanKey, {
      auth: { persistSession: false },
    });

    const { error } = await testClient.auth.getSession();
    if (error) {
      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        return { success: false, message: 'Chave de API (Anon Key) inválida.' };
      }
      if (
        error.message.includes('Invalid path') ||
        error.message.includes('requested path is invalid')
      ) {
        return {
          success: false,
          message: 'Caminho inválido. Certifique-se de fornecer apenas o domínio base do Supabase.',
        };
      }
    }

    return {
      success: true,
      message: 'Conexão com o Supabase estabelecida com sucesso!',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha na conexão de rede com o Supabase.';
    return { success: false, message: msg };
  }
}

/**
 * Script SQL completo com tabelas e políticas RLS para o usuário criar no Supabase SQL Editor
 */
export const SUPABASE_SCHEMA_SQL = `-- ============================================================================
-- SCRIPT DEFINITIVO DE CORREÇÃO E ATUALIZAÇÃO DO BANCO BOOKFLOW NO SUPABASE
-- Execute este script no SQL Editor do Supabase (SQL Editor -> New Query -> Run)
-- ============================================================================

-- 1. Tabela de Perfis de Usuário (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  created_at BIGINT NOT NULL DEFAULT ROUND(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT ROUND(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Tabela de Livros (Books)
CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  total_pages INTEGER NOT NULL DEFAULT 0,
  current_page INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Geral',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'none', -- 'none', 'to_read', 'reading', 'completed'
  start_date TEXT,
  target_deadline TEXT,
  completed_date TEXT,
  rating NUMERIC,
  review TEXT,
  accent_color TEXT DEFAULT 'amber',
  created_at BIGINT NOT NULL DEFAULT ROUND(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT ROUND(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- Garante todas as colunas necessárias na tabela books
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Geral';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'none';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS target_deadline TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS completed_date TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS rating NUMERIC;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS review TEXT;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT 'amber';
ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_status_check;

-- 3. Tabela de Sessões de Leitura (Reading Sessions)
CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  pages_read INTEGER NOT NULL DEFAULT 0,
  ending_page INTEGER,
  notes TEXT,
  timestamp BIGINT NOT NULL DEFAULT ROUND(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

ALTER TABLE public.reading_sessions ADD COLUMN IF NOT EXISTS ending_page INTEGER;
ALTER TABLE public.reading_sessions ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. Tabela de Notas e Citações (Book Notes)
CREATE TABLE IF NOT EXISTS public.book_notes (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'note',
  page_or_chapter TEXT,
  content TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT ROUND(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- 5. Tabela de Metas de Leitura (Reading Goals)
CREATE TABLE IF NOT EXISTS public.reading_goals (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  target_books INTEGER NOT NULL DEFAULT 12,
  target_pages INTEGER DEFAULT 4000,
  daily_page_target INTEGER DEFAULT 20,
  updated_at BIGINT NOT NULL DEFAULT ROUND(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

ALTER TABLE public.reading_goals ADD COLUMN IF NOT EXISTS target_pages INTEGER DEFAULT 4000;
ALTER TABLE public.reading_goals ADD COLUMN IF NOT EXISTS daily_page_target INTEGER DEFAULT 20;

-- 6. Tabela de Categorias Customizadas
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT ROUND(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  UNIQUE(user_id, name)
);

-- 7. Tabela de Lembretes Diários
CREATE TABLE IF NOT EXISTS public.reading_reminders (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  time TEXT NOT NULL DEFAULT '20:00',
  frequency TEXT NOT NULL DEFAULT 'daily',
  browser_push BOOLEAN NOT NULL DEFAULT true,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  custom_message TEXT,
  last_notified_date TEXT,
  updated_at BIGINT NOT NULL DEFAULT ROUND(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- 8. Tabela de Configurações Globais do Sistema (Comunicados, Manutenção)
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at BIGINT NOT NULL DEFAULT ROUND(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

-- ============================================================================
-- FUNÇÃO AUXILIAR NÃO-RECURSIVA DE ADMINISTRAÇÃO
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 1. Checa o e-mail master diretamente do JWT (sem chamar profiles -> ZERO recursão)
  IF LOWER(COALESCE(auth.jwt()->>'email', '')) = 'diegomarques.mat@gmail.com' THEN
    RETURN true;
  END IF;

  -- 2. Checa user_metadata do JWT
  IF COALESCE((auth.jwt()->'user_metadata'->>'is_admin')::boolean, false) = true THEN
    RETURN true;
  END IF;

  -- 3. Checa o registro na tabela profiles
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger automático para criar e atualizar o perfil no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, is_admin, status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN LOWER(NEW.email) = 'diegomarques.mat@gmail.com' THEN true
      ELSE COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false)
    END,
    'active',
    ROUND(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    ROUND(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    is_admin = CASE 
      WHEN LOWER(EXCLUDED.email) = 'diegomarques.mat@gmail.com' THEN true 
      ELSE public.profiles.is_admin 
    END,
    updated_at = ROUND(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Limpeza de políticas anteriores para evitar duplicidade
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins update all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

DROP POLICY IF EXISTS "Users can manage their own books or admins view all" ON public.books;
DROP POLICY IF EXISTS "books_user_policy" ON public.books;

DROP POLICY IF EXISTS "Users can manage their own reading sessions" ON public.reading_sessions;
DROP POLICY IF EXISTS "sessions_user_policy" ON public.reading_sessions;

DROP POLICY IF EXISTS "Users can manage their own book notes" ON public.book_notes;
DROP POLICY IF EXISTS "notes_user_policy" ON public.book_notes;

DROP POLICY IF EXISTS "Users can manage their own goals" ON public.reading_goals;
DROP POLICY IF EXISTS "goals_user_policy" ON public.reading_goals;

DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
DROP POLICY IF EXISTS "categories_user_policy" ON public.categories;

DROP POLICY IF EXISTS "Users can manage their own reminders" ON public.reading_reminders;
DROP POLICY IF EXISTS "reminders_user_policy" ON public.reading_reminders;

DROP POLICY IF EXISTS "settings_select_policy" ON public.system_settings;
DROP POLICY IF EXISTS "settings_modify_policy" ON public.system_settings;

-- POLÍTICAS: Profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
  auth.uid() = id OR 
  auth.uid()::text = id::text OR 
  public.is_admin()
);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (
  auth.uid() = id OR 
  auth.uid()::text = id::text OR 
  public.is_admin()
);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id OR 
  auth.uid()::text = id::text OR 
  public.is_admin()
) WITH CHECK (
  auth.uid() = id OR 
  auth.uid()::text = id::text OR 
  public.is_admin()
);

-- POLÍTICAS: Books (Garante SELECT, INSERT, UPDATE, DELETE e UPSERT seguro)
CREATE POLICY "books_user_policy" ON public.books
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.uid()::text = user_id::text OR 
  public.is_admin()
) WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid()::text = user_id::text
);

-- POLÍTICAS: Reading Sessions
CREATE POLICY "sessions_user_policy" ON public.reading_sessions
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.uid()::text = user_id::text OR 
  public.is_admin()
) WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid()::text = user_id::text
);

-- POLÍTICAS: Book Notes
CREATE POLICY "notes_user_policy" ON public.book_notes
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.uid()::text = user_id::text OR 
  public.is_admin()
) WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid()::text = user_id::text
);

-- POLÍTICAS: Reading Goals
CREATE POLICY "goals_user_policy" ON public.reading_goals
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.uid()::text = user_id::text OR 
  public.is_admin()
) WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid()::text = user_id::text
);

-- POLÍTICAS: Categories
CREATE POLICY "categories_user_policy" ON public.categories
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.uid()::text = user_id::text OR 
  public.is_admin()
) WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid()::text = user_id::text
);

-- POLÍTICAS: Reading Reminders
CREATE POLICY "reminders_user_policy" ON public.reading_reminders
FOR ALL USING (
  auth.uid() = user_id OR 
  auth.uid()::text = user_id::text OR 
  public.is_admin()
) WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid()::text = user_id::text
);

-- POLÍTICAS: System Settings
CREATE POLICY "settings_select_policy" ON public.system_settings
FOR SELECT USING (true);

CREATE POLICY "settings_modify_policy" ON public.system_settings
FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- PERMISSÕES DE ACESSO
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Garante perfil e permissões de administrador master para diegomarques.mat@gmail.com
UPDATE public.profiles 
SET is_admin = true 
WHERE LOWER(email) = 'diegomarques.mat@gmail.com';
`;
