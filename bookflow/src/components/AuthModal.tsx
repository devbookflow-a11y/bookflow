/**
 * @file AuthModal.tsx
 * @description Modal de Autenticação Premium com login, cadastro, recuperação de senha, termos de uso e política de privacidade.
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BookOpen,
  TrendingUp,
  Smartphone,
  KeyRound,
  FileText,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isFullScreen?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isFullScreen = false }) => {
  const {
    user,
    signIn,
    signUp,
    resetPassword,
    loginAsDemoUser,
    isAuthModalOpen,
    closeAuthModal,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modais de Termos e Privacidade dentro da tela de autenticação
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'privacy' | null>(null);

  // O formulário de login fica ativo quando em tela cheia, quando solicitado ou se o usuário não estiver logado
  const isOpen = isFullScreen || isAuthModalOpen || !user;

  // Medidor visual de força da senha para modo cadastro
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 33;
    if (password.length >= 8) score += 33;
    if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score += 34;
    return Math.min(100, score);
  }, [password]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Por favor, informe seu e-mail.');
      return;
    }

    if (mode === 'forgot_password') {
      setIsSubmitting(true);
      try {
        const { error } = await resetPassword(cleanEmail);
        if (error) {
          setErrorMsg(error);
        } else {
          setSuccessMsg(
            'Enviamos as instruções de redefinição para seu e-mail. Verifique sua caixa de entrada e a pasta de spam.'
          );
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password.trim()) {
      setErrorMsg('Por favor, informe sua senha de acesso.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(cleanEmail, password);
        if (error) {
          setErrorMsg(error);
        } else {
          setSuccessMsg('Login realizado com sucesso!');
        }
      } else {
        const { error, needsConfirmation } = await signUp(cleanEmail, password, name);
        if (error) {
          setErrorMsg(error);
        } else if (needsConfirmation) {
          setSuccessMsg('Cadastro criado! Verifique seu e-mail para confirmar seu acesso.');
        } else {
          setSuccessMsg('Conta criada e conectada com sucesso!');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={
          isFullScreen
            ? 'flex-1 flex items-center justify-center p-3 sm:p-5 w-full my-auto animate-in fade-in duration-200'
            : 'fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200'
        }
      >
        <div
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden my-4 sm:my-8 transition-all grid grid-cols-1 md:grid-cols-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* COLUNA ESQUERDA: Apresentação Visual e Valor Comercial */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-800">
            {/* Ambient Light Glows */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -ml-10 -mb-10" />

            {/* Top Brand Tag */}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700/80 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/10 overflow-hidden">
                  <img
                    src="/icon-192x192.png"
                    alt="BookFlow Icon"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight leading-tight text-white">
                    BookFlow
                  </h2>
                  <span className="text-[11px] font-mono text-amber-400 font-medium">
                    Gerenciador de Leituras Inteligente
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                O sistema definitivo para gerenciar seus livros, calcular projeções reais de ritmo e manter a consistência diária.
              </p>

              {/* Destaques de Valor */}
              <div className="space-y-3.5 mt-6">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-slate-100 block font-semibold">Monitor Dinâmico</strong>
                    <span className="text-slate-400 text-[11px]">Projeção em tempo real e alerta de ritmo.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-3 h-3" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-slate-100 block font-semibold">Múltiplos Livros Ativos</strong>
                    <span className="text-slate-400 text-[11px]">Navegue entre livros em leitura simultânea.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-3 h-3" />
                  </div>
                  <div className="text-xs">
                    <strong className="text-slate-100 block font-semibold">Sincronização Total</strong>
                    <span className="text-slate-400 text-[11px]">
                      Sua estante virtual sincronizada e acessível de qualquer dispositivo, a qualquer momento.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé da Coluna Esquerda */}
            <div className="relative z-10 pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Segurança e privacidade dos seus dados
              </span>
            </div>
          </div>

          {/* COLUNA DIREITA: Formulário Limpo e Elegante */}
          <div className="md:col-span-3 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Top Bar: Cabeçalho do formulário e Botão Fechar (se logado) */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {mode === 'login' && 'Acessar sua conta'}
                  {mode === 'signup' && 'Criar sua conta no BookFlow'}
                  {mode === 'forgot_password' && 'Recuperar acesso à conta'}
                </h3>

                {user && !isFullScreen && (
                  <button
                    type="button"
                    onClick={closeAuthModal}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Fechar"
                    aria-label="Fechar modal de autenticação"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Alternador de Modo: Entrar vs Criar Conta (oculto no modo recuperação) */}
              {mode !== 'forgot_password' ? (
                <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`py-2 rounded-xl transition-all ${
                      mode === 'login'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`py-2 rounded-xl transition-all ${
                      mode === 'signup'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    Criar Conta
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Voltar para o login</span>
                  </button>
                </div>
              )}

              {/* Mensagens de Erro ou Sucesso */}
              {errorMsg && (
                <div className="p-3.5 mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{successMsg}</span>
                </div>
              )}

              {/* Formulário Principal */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Nome (apenas modo cadastro) */}
                {mode === 'signup' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Nome Completo (opcional)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Carlos Eduardo"
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* Endereço de E-mail */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    E-mail *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  {mode === 'forgot_password' && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Digite o e-mail cadastrado e enviaremos um link de redefinição para criar uma nova senha.
                    </p>
                  )}
                </div>

                {/* Senha (apenas em login ou signup) */}
                {mode !== 'forgot_password' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Senha *
                      </label>
                      {mode === 'login' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot_password');
                            setErrorMsg(null);
                            setSuccessMsg(null);
                          }}
                          className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-medium"
                        >
                          Esqueceu a senha?
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400">Mínimo 6 caracteres</span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Barra de Força da Senha no Cadastro */}
                    {mode === 'signup' && password.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordStrength < 40
                                ? 'bg-rose-500'
                                : passwordStrength < 70
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${passwordStrength}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>
                            {passwordStrength < 40
                              ? 'Senha fraca'
                              : passwordStrength < 70
                              ? 'Senha média'
                              : 'Senha segura'}
                          </span>
                          <span>{password.length}/6+ carac.</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Botão de Envio Principal: estritamente "Entrar" ou "Criar Conta" ou "Enviar Instruções" */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] mt-3"
                >
                  {isSubmitting ? (
                    <span>Processando...</span>
                  ) : mode === 'login' ? (
                    <>
                      <span>Entrar</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : mode === 'signup' ? (
                    <>
                      <span>Criar Conta</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Enviar Instruções</span>
                    </>
                  )}
                </button>
              </form>

              {/* Linha Divisória e Opção de Modo Demonstração */}
              {mode !== 'forgot_password' && (
                <>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
                      <span className="bg-white dark:bg-slate-900 px-3">Ou acesse agora</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => loginAsDemoUser()}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Continuar em Modo Demonstração</span>
                  </button>
                </>
              )}
            </div>

            {/* Links Discretos de Termos de Uso e Política de Privacidade */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
              <button
                type="button"
                onClick={() => setActiveLegalModal('terms')}
                className="hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors"
              >
                Termos de Uso
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setActiveLegalModal('privacy')}
                className="hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors"
              >
                Política de Privacidade
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Interno: Termos de Uso */}
      {activeLegalModal === 'terms' && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveLegalModal(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-7 max-h-[85vh] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Termos de Uso do BookFlow
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 text-xs text-slate-600 dark:text-slate-300 space-y-3 overflow-y-auto pr-1">
              <p>
                <strong>1. Aceitação dos Termos:</strong> Ao utilizar a aplicação BookFlow, você concorda em gerenciar seu acervo pessoal de leitura de acordo com as diretrizes aqui estabelecidas.
              </p>
              <p>
                <strong>2. Propriedade dos Seus Dados:</strong> Todo o seu histórico de leitura, notas, livros cadastrados e sessões pertencem única e exclusivamente a você. Você tem o direito de exportar seus dados a qualquer momento via arquivo JSON ou planilha CSV.
              </p>
              <p>
                <strong>3. Sincronização em Nuvem e Fallback:</strong> O BookFlow oferece sincronização contínua e modo offline/local para que você nunca perca suas sessões de leitura mesmo sem internet.
              </p>
              <p>
                <strong>4. Disponibilidade do Serviço:</strong> Nos empenhamos em manter alta disponibilidade em todos os serviços. Em caso de manutenção temporária, avisos globais serão exibidos com antecedência.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-amber-600 text-xs font-bold"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Interno: Política de Privacidade */}
      {activeLegalModal === 'privacy' && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveLegalModal(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-7 max-h-[85vh] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Política de Privacidade & Proteção de Dados
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 text-xs text-slate-600 dark:text-slate-300 space-y-3 overflow-y-auto pr-1">
              <p>
                <strong>1. Compromisso com a Privacidade:</strong> O BookFlow não comercializa, não compartilha e não expõe suas informações de leitura ou dados pessoais a terceiros.
              </p>
              <p>
                <strong>2. Segurança na Autenticação:</strong> A autenticação utiliza conexões criptografadas com proteção de ponta a ponta e senhas protegidas com algoritmos de hash seguros.
              </p>
              <p>
                <strong>3. Armazenamento Local e Preferências:</strong> Utilizamos armazenamento seguro no seu navegador apenas para preservar suas preferências visuais (tema claro/escuro, cores de perfil e metas diárias).
              </p>
              <p>
                <strong>4. Exclusão de Conta e Dados:</strong> Você pode solicitar a remoção integral de suas informações ou restaurar configurações padrão a qualquer instante pelo painel de Configurações.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-amber-600 text-xs font-bold"
              >
                Compreendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
