/**
 * @file AuthContext.tsx
 * @description Contexto de autenticação de usuários integrado ao Supabase com fallback seguro.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, getSupabaseConfig, SupabaseConfig } from '../services/supabaseClient';

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  isDemo?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  supabaseConfig: SupabaseConfig;
  refreshConfig: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateUserProfile: (data: { name?: string; avatarUrl?: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isLogoutConfirmOpen: boolean;
  requestSignOut: () => void;
  cancelSignOut: () => void;
  confirmSignOut: () => Promise<void>;
  loginAsDemoUser: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const STORAGE_KEY_DEMO_USER = 'bookflow_demo_user_v1';

// Checa permissão estrita de administrador: exclusivamente o e-mail master ou metadados de sistema
function isEmailOrMetaAdmin(email?: string, meta?: Record<string, any>): boolean {
  if (!email) return false;
  const cleanEmail = email.toLowerCase().trim();
  if (cleanEmail === 'diegomarques.mat@gmail.com') return true;
  if (meta?.is_admin === true) return true;
  return false;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => getSupabaseConfig());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Apenas o administrador autenticado tem acesso
  const isAdmin = Boolean(
    user && (
      isEmailOrMetaAdmin(user.email) ||
      user.isAdmin === true
    )
  );

  const requestSignOut = useCallback(() => {
    setIsLogoutConfirmOpen(true);
  }, []);

  const cancelSignOut = useCallback(() => {
    setIsLogoutConfirmOpen(false);
  }, []);

  const signOut = async (): Promise<void> => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('[Auth] Erro no signOut Supabase:', err);
      }
    }

    try {
      localStorage.removeItem(STORAGE_KEY_DEMO_USER);
      // Remove todas as chaves de sessão e tokens do Supabase gravadas no navegador
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token') || key.startsWith('bookflow_user_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // fallback
    }

    setUser(null);
    setSession(null);
    setIsLogoutConfirmOpen(false);
    setIsAuthModalOpen(true);
  };

  const confirmSignOut = async (): Promise<void> => {
    await signOut();
  };

  const refreshConfig = useCallback(() => {
    const config = getSupabaseConfig();
    setSupabaseConfig(config);
  }, []);

  // Sincroniza e busca perfil no Supabase para garantir permissões atualizadas
  const syncSupabaseProfile = useCallback(async (userId: string, email: string, name: string): Promise<boolean> => {
    const client = getSupabaseClient();
    const isSpecialAdmin = isEmailOrMetaAdmin(email);
    if (!client) return isSpecialAdmin;

    try {
      const { data, error } = await client
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        if (isSpecialAdmin && !data.is_admin) {
          // Atualiza permissão para admin se for o dono da conta
          await client.from('profiles').update({ is_admin: true }).eq('id', userId);
          return true;
        }
        return Boolean(data.is_admin || isSpecialAdmin);
      } else {
        // Cria perfil inicial no Supabase
        await client.from('profiles').upsert({
          id: userId,
          email,
          name,
          is_admin: isSpecialAdmin,
          status: 'active',
          created_at: Date.now(),
          updated_at: Date.now(),
        });
        return isSpecialAdmin;
      }
    } catch (err) {
      console.warn('[Auth] Falha de sincronização de perfil com Supabase:', err);
      return isSpecialAdmin;
    }
  }, []);

// Auxiliares de perfil e metadados
function getUserAvatar(userId?: string, meta?: Record<string, any>): string {
  if (!userId) return '';
  try {
    const localAvatar = localStorage.getItem(`bookflow_user_avatar_${userId}`);
    if (localAvatar) return localAvatar;
  } catch {}
  if (meta?.avatar_url) return meta.avatar_url;
  if (meta?.picture) return meta.picture;
  return '';
}

function getUserDisplayName(userId?: string, meta?: Record<string, any>, fallbackEmail?: string): string {
  if (userId) {
    try {
      const localName = localStorage.getItem(`bookflow_user_name_${userId}`);
      if (localName) return localName;
    } catch {}
  }
  if (meta?.full_name) return meta.full_name;
  if (meta?.name) return meta.name;
  if (fallbackEmail) return fallbackEmail.split('@')[0];
  return 'Leitor';
}

  // Inicializa sessão do Supabase ou usuário local
  useEffect(() => {
    let mounted = true;
    const client = getSupabaseClient();

    if (!client) {
      try {
        const demoRaw = localStorage.getItem(STORAGE_KEY_DEMO_USER);
        if (demoRaw) {
          const parsed = JSON.parse(demoRaw);
          if (mounted) setUser(parsed);
        }
      } catch {
        // fallback
      }
      setLoading(false);
      return;
    }

    // Obter sessão atual
    client.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!mounted) return;
      if (currentSession?.user) {
        const email = currentSession.user.email || '';
        const name = getUserDisplayName(currentSession.user.id, currentSession.user.user_metadata, email);
        const avatarUrl = getUserAvatar(currentSession.user.id, currentSession.user.user_metadata);
        setSession(currentSession);

        const profileIsAdmin = await syncSupabaseProfile(currentSession.user.id, email, name);

        setUser({
          id: currentSession.user.id,
          email,
          name,
          avatarUrl,
          isAdmin: profileIsAdmin,
          isDemo: false,
        });
      } else {
        try {
          const demoRaw = localStorage.getItem(STORAGE_KEY_DEMO_USER);
          if (demoRaw) {
            setUser(JSON.parse(demoRaw));
          }
        } catch {
          // fallback
        }
      }
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession?.user) {
        const email = newSession.user.email || '';
        const name = getUserDisplayName(newSession.user.id, newSession.user.user_metadata, email);
        const avatarUrl = getUserAvatar(newSession.user.id, newSession.user.user_metadata);
        const profileIsAdmin = await syncSupabaseProfile(newSession.user.id, email, name);

        setUser({
          id: newSession.user.id,
          email,
          name,
          avatarUrl,
          isAdmin: profileIsAdmin,
          isDemo: false,
        });
        localStorage.removeItem(STORAGE_KEY_DEMO_USER);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabaseConfig, syncSupabaseProfile]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const client = getSupabaseClient();
    if (!client) {
      return {
        error:
          'O Supabase não está inicializado. Verifique se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY foram informadas ou utilize o "Modo Demonstração".',
      };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password;

      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'E-mail ou senha incorretos. Por favor, revise seus dados.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.';
        } else if (
          msg.includes('Invalid path') ||
          msg.includes('requested path is invalid')
        ) {
          msg =
            'Erro de rota no Supabase: certifique-se de que a URL configurada seja no formato https://seu-projeto.supabase.co sem barras no final.';
        }
        return { error: msg };
      }

      if (data.user) {
        const userEmail = data.user.email || cleanEmail;
        const userName = getUserDisplayName(data.user.id, data.user.user_metadata, userEmail);
        const userAvatar = getUserAvatar(data.user.id, data.user.user_metadata);
        const profileIsAdmin = await syncSupabaseProfile(data.user.id, userEmail, userName);
        setUser({
          id: data.user.id,
          email: userEmail,
          name: userName,
          avatarUrl: userAvatar,
          isAdmin: profileIsAdmin,
          isDemo: false,
        });
        setIsAuthModalOpen(false);
      }

      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha inesperada ao realizar login.';
      return { error: msg };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string
  ): Promise<{ error: string | null; needsConfirmation?: boolean }> => {
    const client = getSupabaseClient();
    if (!client) {
      return {
        error:
          'O Supabase não está inicializado. Verifique se as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY foram informadas ou acesse pelo "Modo Demonstração".',
      };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password;

      // Executa signUp enviando para o endpoint padrão /auth/v1/signup com e-mail e senha
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            full_name: name?.trim() || cleanEmail.split('@')[0],
          },
        },
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('User already registered')) {
          msg = 'Este e-mail já está cadastrado. Alterne para a aba "Entrar na Conta" e faça login.';
        } else if (
          msg.includes('Invalid path') ||
          msg.includes('requested path is invalid')
        ) {
          msg =
            'Erro de rota no Supabase: certifique-se de que a URL configurada seja no formato https://seu-projeto.supabase.co sem barras no final.';
        }
        return { error: msg };
      }

      // Verificação quando confirmação por e-mail está ativa e o e-mail já existe (GoTrue esconde erro mas identities vem vazio)
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          error: 'Este e-mail já está cadastrado. Alterne para a aba "Entrar na Conta" e informe sua senha.',
        };
      }

      // Se o usuário foi criado e já autenticado (sem confirmação de e-mail obrigatória)
      if (data.session && data.user) {
        const userEmail = data.user.email || cleanEmail;
        const userName = name?.trim() || userEmail.split('@')[0];
        const userAvatar = getUserAvatar(data.user.id, data.user.user_metadata);
        const profileIsAdmin = await syncSupabaseProfile(data.user.id, userEmail, userName);
        setUser({
          id: data.user.id,
          email: userEmail,
          name: userName,
          avatarUrl: userAvatar,
          isAdmin: profileIsAdmin,
          isDemo: false,
        });
        setIsAuthModalOpen(false);
        return { error: null, needsConfirmation: false };
      }

      // Se a confirmação de e-mail estiver ativa no projeto Supabase
      if (data.user && !data.session) {
        return { error: null, needsConfirmation: true };
      }

      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha inesperada ao cadastrar usuário.';
      return { error: msg };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { error: 'Por favor, informe seu endereço de e-mail.' };
    }

    const client = getSupabaseClient();
    if (!client) {
      // Simulação graciosa quando em modo local/demonstração
      await new Promise((resolve) => setTimeout(resolve, 600));
      return { error: null };
    }

    try {
      const redirectUrl = window.location.origin;
      const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('rate limit')) {
          msg = 'Muitas solicitações recentes. Por favor, aguarde alguns instantes antes de tentar novamente.';
        }
        return { error: msg };
      }

      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao solicitar instruções de redefinição de senha.';
      return { error: msg };
    }
  };

  const updateUserProfile = useCallback(
    async (data: { name?: string; avatarUrl?: string }): Promise<{ error: string | null }> => {
      if (!user) {
        return { error: 'Nenhum usuário conectado.' };
      }

      const updatedUser: AppUser = {
        ...user,
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      };

      setUser(updatedUser);

      try {
        if (data.avatarUrl !== undefined) {
          localStorage.setItem(`bookflow_user_avatar_${user.id}`, data.avatarUrl);
        }
        if (data.name !== undefined) {
          localStorage.setItem(`bookflow_user_name_${user.id}`, data.name);
        }
        if (user.isDemo) {
          localStorage.setItem(STORAGE_KEY_DEMO_USER, JSON.stringify(updatedUser));
        }
      } catch (e) {
        console.warn('[Auth] Erro ao salvar perfil localmente:', e);
      }

      const client = getSupabaseClient();
      if (client && !user.isDemo) {
        try {
          await client.auth.updateUser({
            data: {
              ...(data.name !== undefined ? { full_name: data.name } : {}),
              ...(data.avatarUrl !== undefined ? { avatar_url: data.avatarUrl } : {}),
            },
          });

          await client
            .from('profiles')
            .update({
              ...(data.name !== undefined ? { name: data.name } : {}),
              ...(data.avatarUrl !== undefined ? { avatar_url: data.avatarUrl } : {}),
              updated_at: Date.now(),
            })
            .eq('id', user.id);
        } catch (err) {
          console.warn('[Auth] Atualização sincronizada com Supabase:', err);
        }
      }

      return { error: null };
    },
    [user]
  );

  const loginAsDemoUser = () => {
    const demoUser: AppUser = {
      id: 'demo-user-local',
      email: 'leitor@bookflow.app',
      name: 'Leitor BookFlow',
      avatarUrl: getUserAvatar('demo-user-local'),
      isAdmin: false,
      isDemo: true,
    };
    setUser(demoUser);
    localStorage.setItem(STORAGE_KEY_DEMO_USER, JSON.stringify(demoUser));
    setIsAuthModalOpen(false);
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        supabaseConfig,
        refreshConfig,
        signIn,
        signUp,
        resetPassword,
        updateUserProfile,
        signOut,
        isLogoutConfirmOpen,
        requestSignOut,
        cancelSignOut,
        confirmSignOut,
        loginAsDemoUser,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
