import React, { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Moon,
  User,
  Mail,
  Shield,
  Bell,
  Volume2,
  VolumeX,
  Target,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  LogOut,
  Check,
  Palette,
  Layers,
  Cloud,
  CheckCircle2,
  Sliders,
  BellRing,
  Activity,
  Wifi,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon,
  Smartphone,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { useBooks } from '../context/BookContext';
import { useAuth } from '../context/AuthContext';
import { calculateDashboardStats } from '../utils/dashboardMetrics';
import { getTodayString } from '../utils/dateUtils';

const AVATAR_COLORS = [
  { id: 'amber', bg: 'from-amber-500 to-amber-600', border: 'border-amber-400' },
  { id: 'indigo', bg: 'from-indigo-500 to-indigo-600', border: 'border-indigo-400' },
  { id: 'emerald', bg: 'from-emerald-500 to-emerald-600', border: 'border-emerald-400' },
  { id: 'rose', bg: 'from-rose-500 to-rose-600', border: 'border-rose-400' },
  { id: 'purple', bg: 'from-purple-500 to-purple-600', border: 'border-purple-400' },
  { id: 'sky', bg: 'from-sky-500 to-sky-600', border: 'border-sky-400' },
];

const PRESET_AVATARS = [
  {
    id: 'reader1',
    label: 'Leitora Moderna',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'reader2',
    label: 'Leitor Contemporâneo',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'reader3',
    label: 'Leitora Clássica',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'reader4',
    label: 'Leitor com Livro',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'reader5',
    label: 'Entusiasta Literária',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'reader6',
    label: 'Escritor Criativo',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  },
];

export const SettingsView: React.FC = () => {
  const {
    books,
    activeBook,
    theme,
    toggleTheme,
    goal,
    updateGoal,
    reminderSettings,
    updateReminderSettings,
    browserNotificationPermission,
    requestNotificationPermission,
    triggerTestReminder,
    openCategoryModal,
    exportDataJson,
    importDataJson,
    resetToDefaults,
    cloudConnected,
    isSyncing,
    openOnboarding,
    databaseHealth,
    checkDatabaseHealth,
    accentColor,
    setAccentColor,
  } = useBooks();

  const { user, isAdmin, requestSignOut, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Estados locais para edição de perfil
  const [userName, setUserName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [saveNameSuccess, setSaveNameSuccess] = useState(false);
  const [avatarFeedback, setAvatarFeedback] = useState<string | null>(null);
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string | null>(null);

  // Sincroniza estado com dados atualizados do usuário
  useEffect(() => {
    if (user?.name) setUserName(user.name);
    if (user?.avatarUrl !== undefined) setAvatarUrl(user.avatarUrl || '');
  }, [user?.name, user?.avatarUrl]);

  const stats = calculateDashboardStats(books);
  const today = getTodayString();
  const hasLoggedToday = (stats.dailyActivity?.find((d) => d.date === today)?.pages || 0) > 0;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    await updateUserProfile({ name: userName.trim() });
    setSaveNameSuccess(true);
    setTimeout(() => setSaveNameSuccess(false), 2500);
  };

  const handleChoosePresetAvatar = async (url: string) => {
    setAvatarUrl(url);
    await updateUserProfile({ avatarUrl: url });
    setAvatarFeedback('Foto de perfil atualizada com sucesso!');
    setTimeout(() => setAvatarFeedback(null), 3000);
  };

  const handleApplyAvatarUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customAvatarInput.trim();
    if (!clean) return;

    setAvatarUrl(clean);
    await updateUserProfile({ avatarUrl: clean });
    setCustomAvatarInput('');
    setAvatarFeedback('Foto de perfil atualizada!');
    setTimeout(() => setAvatarFeedback(null), 3000);
  };

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarFeedback('Por favor, selecione um arquivo de imagem (PNG, JPG, WEBP).');
      setTimeout(() => setAvatarFeedback(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        // Redimensionar e comprimir no navegador via Canvas para manter o banco e o localStorage rápidos
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 256;
          let w = img.width;
          let h = img.height;

          if (w > h) {
            if (w > MAX_SIZE) {
              h = Math.round((h * MAX_SIZE) / w);
              w = MAX_SIZE;
            }
          } else {
            if (h > MAX_SIZE) {
              w = Math.round((w * MAX_SIZE) / h);
              h = MAX_SIZE;
            }
          }

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);

          setAvatarUrl(compressed);
          await updateUserProfile({ avatarUrl: compressed });
          setAvatarFeedback('Foto de perfil salva com sucesso!');
          setTimeout(() => setAvatarFeedback(null), 3000);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
    if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
  };

  const handleRemoveAvatar = async () => {
    setAvatarUrl('');
    await updateUserProfile({ avatarUrl: '' });
    setAvatarFeedback('Foto removida. Usando inicial de perfil.');
    setTimeout(() => setAvatarFeedback(null), 3000);
  };

  const handleSelectAvatarColor = (colorId: string) => {
    setAccentColor(colorId as any);
  };

  const handleTestReminder = () => {
    triggerTestReminder();
    setTestNotificationFeedback('Notificação de teste disparada!');
    setTimeout(() => setTestNotificationFeedback(null), 3000);
  };

  const handleExport = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const ok = await importDataJson(content);
          if (ok) {
            alert('Biblioteca importada com sucesso e sincronizada com a nuvem!');
          } else {
            alert('Erro ao importar arquivo. Verifique o formato JSON.');
          }
        } catch {
          alert('Erro ao importar arquivo. Verifique o formato JSON.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    if (
      window.confirm(
        'Deseja restaurar os livros e metas de exemplo originais? Suas edições atuais serão substituídas.'
      )
    ) {
      resetToDefaults();
    }
  };

  const currentColorObj =
    AVATAR_COLORS.find((c) => c.id === accentColor) || AVATAR_COLORS[0];

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-16">
      {/* Top Header */}
      <div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
          Preferências do Leitor
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Configurações & Personalização
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Personalize seu avatar, metas de leitura, lembretes e gerencie sua experiência literária.
        </p>
      </div>

      {/* 1. SEÇÃO: PERFIL & FOTO DO LEITOR */}
      <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-amber-500" />
            <span>Perfil & Identidade do Leitor</span>
          </h2>
          {avatarFeedback && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-fade-in">
              {avatarFeedback}
            </span>
          )}
        </div>

        {/* Bloco Superior: Visualização Atual do Avatar e Nome */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          {/* Avatar com Pré-visualização Real ou Inicial */}
          <div className="relative group shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName || 'Avatar'}
                className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-amber-500/50"
              />
            ) : (
              <div
                className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${currentColorObj.bg} text-white flex items-center justify-center text-3xl font-black uppercase shadow-lg shadow-amber-500/10 border-2 ${currentColorObj.border}`}
              >
                {(userName || user?.email || 'B').charAt(0)}
              </div>
            )}

            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                title="Remover foto personalizada"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0 w-full space-y-3">
            <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Seu nome de exibição"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:text-amber-400 hover:bg-slate-800 text-xs font-bold transition-colors shrink-0 flex items-center justify-center gap-1.5"
              >
                {saveNameSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Salvo!</span>
                  </>
                ) : (
                  <span>Atualizar Nome</span>
                )}
              </button>
            </form>

            {/* Informações da Conta & Ação de Logout */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user?.email || 'Modo Convidado'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {user ? 'Sincronização em Nuvem Ativa' : 'Modo Demonstração'}
                </span>
                {isAdmin && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      Administrador Mestre
                    </span>
                  </>
                )}
              </div>

              {user && (
                <button
                  type="button"
                  onClick={requestSignOut}
                  className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Sair da sua conta no BookFlow"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da Conta</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bloco de Customização da Foto de Perfil (Avatar) */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-amber-500" />
              <span>Escolha sua Foto de Perfil</span>
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Selecione um dos avatares literários, faça upload de uma imagem do seu aparelho ou insira um link direto.
            </p>
          </div>

          {/* Opção 1: Avatares Pré-definidos Estilosos */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Avatares Literários Rápidos:
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {PRESET_AVATARS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleChoosePresetAvatar(preset.url)}
                  className={`group relative flex flex-col items-center gap-1.5 p-1.5 rounded-2xl border transition-all ${
                    avatarUrl === preset.url
                      ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                  title={preset.label}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-12 h-12 rounded-xl object-cover shadow-xs group-hover:scale-105 transition-transform"
                  />
                  <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-full">
                    {preset.label.split(' ')[0]}
                  </span>
                  {avatarUrl === preset.url && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Opção 2 e 3: Upload do Aparelho & Link Direto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Upload do Arquivo Local */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Foto do Aparelho</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Envie uma foto da sua galeria ou câmera</p>
                </div>
              </div>
              <label className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer text-center transition-colors flex items-center justify-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                <span>Escolher Imagem</span>
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Inserir URL Direta */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Link da Imagem</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Cole a URL de qualquer foto na web</p>
                </div>
              </div>
              <form onSubmit={handleApplyAvatarUrl} className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={customAvatarInput}
                  onChange={(e) => setCustomAvatarInput(e.target.value)}
                  placeholder="https://exemplo.com/minha-foto.jpg"
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={!customAvatarInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                >
                  Aplicar
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Escolha da Cor Global do Perfil e SaaS */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-amber-500" />
              <span>Tema de Cor Global do Perfil & Sistema:</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              A cor selecionada é aplicada instantaneamente em estantes, botões, gráficos e navegação.
            </span>
            <div className="flex items-center gap-2 pt-1">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => handleSelectAvatarColor(color.id)}
                  aria-label={`Escolher tema ${color.id}`}
                  title={`Tema ${color.id.charAt(0).toUpperCase() + color.id.slice(1)}`}
                  className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${color.bg} transition-all flex items-center justify-center ${
                    accentColor === color.id
                      ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white dark:ring-offset-slate-900 scale-110 shadow-sm'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {accentColor === color.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Botão de Logout rápido com Confirmação */}
          {user && (
            <button
              type="button"
              onClick={requestSignOut}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-center"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da Conta (Logout)</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. SEÇÃO: APARÊNCIA & TEMA */}
      <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Aparência & Tema Visual</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Escolha como o BookFlow se adapta à sua preferência de contraste e conforto visual.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card Tema Claro */}
          <div
            onClick={() => theme === 'dark' && toggleTheme()}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              theme === 'light'
                ? 'bg-amber-500/5 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Modo Claro
                </h3>
                <span className="text-[11px] text-slate-500">Visual limpo e alto contraste para o dia</span>
              </div>
            </div>
            {theme === 'light' && <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />}
          </div>

          {/* Card Tema Escuro */}
          <div
            onClick={() => theme === 'light' && toggleTheme()}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
              theme === 'dark'
                ? 'bg-amber-500/5 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Modo Escuro (Dark)
                </h3>
                <span className="text-[11px] text-slate-500">Conforto para leituras noturnas e bateria</span>
              </div>
            </div>
            {theme === 'dark' && <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />}
          </div>
        </div>
      </section>

      {/* 3. SEÇÃO: METAS DE LEITURA & HÁBITOS */}
      <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-500" />
          <span>Metas & Ritmo de Leitura</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Defina seu objetivo diário e o desafio anual de livros concluídos.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Meta Diária de Páginas */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Meta Diária Recomendada
              </span>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                {goal.dailyPageTarget} páginas / dia
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[10, 20, 30, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateGoal({ dailyPageTarget: preset })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    goal.dailyPageTarget === preset
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-amber-400'
                  }`}
                >
                  {preset}p
                </button>
              ))}
            </div>

            <div className="pt-1">
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={goal.dailyPageTarget}
                onChange={(e) => updateGoal({ dailyPageTarget: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>5 págs/dia</span>
                <span>100 págs/dia</span>
              </div>
            </div>
          </div>

          {/* Meta Anual de Livros */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Desafio Literário ({goal.year})
              </span>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                {goal.targetBooks} livros / ano
              </span>
            </div>

            <div className="flex items-center gap-2">
              {[6, 12, 24, 52].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateGoal({ targetBooks: preset })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    goal.targetBooks === preset
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-amber-400'
                  }`}
                >
                  {preset} livros
                </button>
              ))}
            </div>

            <div className="pt-1">
              <input
                type="range"
                min="1"
                max="60"
                value={goal.targetBooks}
                onChange={(e) => updateGoal({ targetBooks: parseInt(e.target.value, 10) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>1 livro</span>
                <span>60 livros</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO: LEMBRETE DIÁRIO DE LEITURA & NOTIFICAÇÕES PUSH */}
      <section className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Header with Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl transition-colors ${
                reminderSettings.enabled
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Lembrete Diário de Leitura
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    reminderSettings.enabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {reminderSettings.enabled ? 'Ativo' : 'Desativado'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Defina seu horário preferencial para receber alertas e cultivar a constância de leitura.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {testNotificationFeedback && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in font-mono">
                {testNotificationFeedback}
              </span>
            )}
            <button
              type="button"
              onClick={() => updateReminderSettings({ enabled: !reminderSettings.enabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                reminderSettings.enabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={reminderSettings.enabled}
              title={reminderSettings.enabled ? 'Desativar lembretes' : 'Ativar lembretes'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  reminderSettings.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Reminder Settings Controls */}
        {reminderSettings.enabled ? (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: Time Picker & Presets */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Horário Preferencial
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={reminderSettings.time}
                    onChange={(e) => updateReminderSettings({ time: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Atalhos:</span>
                  {['08:00', '13:00', '20:00', '21:30'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => updateReminderSettings({ time: preset })}
                      className={`px-2 py-0.5 text-[10px] font-mono rounded-md border transition-colors ${
                        reminderSettings.time === preset
                          ? 'bg-amber-500 text-white border-amber-500 font-bold'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 2: Frequency Selector */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  Frequência dos Lembretes
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    { id: 'daily', label: 'Todos os Dias' },
                    { id: 'weekdays', label: 'Dias Úteis (Segunda a Sexta)' },
                    { id: 'weekends', label: 'Finais de Semana (Sáb e Dom)' },
                  ].map((freq) => (
                    <button
                      key={freq.id}
                      type="button"
                      onClick={() =>
                        updateReminderSettings({
                          frequency: freq.id as 'daily' | 'weekdays' | 'weekends',
                        })
                      }
                      className={`w-full py-1.5 px-2.5 text-xs font-semibold rounded-lg text-left transition-colors flex items-center justify-between ${
                        reminderSettings.frequency === freq.id
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{freq.label}</span>
                      {reminderSettings.frequency === freq.id && (
                        <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column 3: Push Notifications & Audio */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2.5 flex flex-col justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-indigo-500" />
                    Notificações do Navegador (Push)
                  </label>

                  {/* Status Indicator */}
                  <div className="mt-2 text-xs">
                    {browserNotificationPermission === 'granted' ? (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[11px] font-semibold leading-tight">
                          Permissão concedida no navegador!
                        </span>
                      </div>
                    ) : browserNotificationPermission === 'denied' ? (
                      <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">
                          Notificações bloqueadas no navegador. Habilite nas permissões do site.
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={requestNotificationPermission}
                        className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Habilitar Notificações Push</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Sound Chime Toggle */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    {reminderSettings.soundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>Aviso sonoro suave</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateReminderSettings({ soundEnabled: !reminderSettings.soundEnabled })
                    }
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                      reminderSettings.soundEnabled
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {reminderSettings.soundEnabled ? 'Ligado' : 'Mudo'}
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Message Field & Test Trigger Bar */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Mensagem Motivacional do Lembrete:
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateReminderSettings({
                        customMessage:
                          'Hora da sua leitura diária! Dedique alguns minutos para avançar no seu livro.',
                      })
                    }
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1"
                    title="Restaurar frase padrão"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Padrão</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={reminderSettings.customMessage || ''}
                  onChange={(e) => updateReminderSettings({ customMessage: e.target.value })}
                  placeholder="Ex: Hora da sua leitura diária! Dedique alguns minutos para avançar no seu livro."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={handleTestReminder}
                  className="px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Disparar lembrete de teste para conferir visualmente e no navegador"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Testar Notificação Agora</span>
                </button>
              </div>
            </div>

            {/* Today's Reading Status Feedback */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                {hasLoggedToday ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    Você já registrou páginas lidas hoje! Excelente constância.
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                    <Clock className="w-4 h-4" />
                    Próximo lembrete diário agendado para hoje às{' '}
                    <strong className="font-mono font-bold">{reminderSettings.time}</strong>.
                  </span>
                )}
              </div>

              <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
                Livro atual: {activeBook?.title || 'Nenhum selecionado'}
              </span>
            </div>
          </div>
        ) : (
          <div className="pt-4 text-center py-6 text-slate-400 text-xs">
            Os lembretes diários estão desativados. Ative a chave acima para configurar seu horário preferencial e cultivar seu hábito de leitura.
          </div>
        )}
      </section>

      {/* 5. SEÇÃO: GERENCIAMENTO DE DADOS & BACKUP */}
      <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-500" />
          <span>Dados & Categorias Literárias</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          Gerencie categorias customizadas ou faça backup completo da sua biblioteca.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={openCategoryModal}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>Gerenciar Categorias</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-sky-500" />
            <span>Exportar Backup (JSON)</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span>Importar Backup</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors flex items-center gap-2 ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Livros Padrão</span>
          </button>
        </div>
      </section>

      {/* 6. SEÇÃO: AJUDA, ONBOARDING E DIAGNÓSTICO */}
      <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{isAdmin ? 'Diagnóstico & Tour Guiado' : 'Ajuda & Tour Guiado'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAdmin
              ? 'Monitore a conectividade da infraestrutura e revise o tour interativo.'
              : 'Reveja a apresentação das principais funcionalidades do BookFlow a qualquer momento.'}
          </p>
        </div>

        <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-2' : ''} gap-5`}>
          {/* Card: Tour Guiado (Onboarding) para todos os leitores */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Tour Guiado do BookFlow</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  5 Passos
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Revisite a explicação passo a passo das ferramentas: estantes, card de leitura ativa com seletor alfabético, histórico editável de sessões e metas de leitura.
              </p>
            </div>

            <button
              type="button"
              onClick={openOnboarding}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Iniciar Tour Guiado Novamente</span>
            </button>
          </div>

          {/* Card: Verificação de Saúde do Banco (Exclusivo do Administrador) */}
          {isAdmin && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-emerald-500" />
                    <span>Diagnóstico da Conexão</span>
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      databaseHealth?.status === 'healthy'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                        : databaseHealth?.status === 'degraded'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {databaseHealth?.status === 'healthy'
                      ? 'Excelente'
                      : databaseHealth?.status === 'degraded'
                      ? 'Instável / Lenta'
                      : 'Modo Local'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {databaseHealth?.message || 'Verificação periódica ativa.'}
                </p>

                {databaseHealth && databaseHealth.latencyMs > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>Latência da requisição:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {databaseHealth.latencyMs} ms
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => checkDatabaseHealth()}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                <span>Verificar Conexão Agora</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
