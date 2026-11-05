/**
 * @file OnboardingTourModal.tsx
 * @description Tour guiado interativo de boas-vindas para o primeiro acesso dos usuários do BookFlow.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Library,
  ListOrdered,
  CalendarCheck,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  highlightText: string;
  badge: string;
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps: TourStep[] = [
    {
      id: 0,
      title: 'Bem-vindo ao BookFlow!',
      subtitle: 'O seu santuário de leitura inteligente',
      description:
        'O BookFlow foi desenhado para transformar seus hábitos de leitura. Acompanhe seu ritmo diário, organize seu acervo com segurança e alcance suas metas literárias sem atrito.',
      icon: (
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25">
          <Sparkles className="w-8 h-8" />
        </div>
      ),
      highlightText: 'Sincronização em nuvem e experiência fluida em todos os dispositivos.',
      badge: 'Início',
    },
    {
      id: 1,
      title: 'Estantes e Biblioteca',
      subtitle: 'Organização clara e intuitiva',
      description:
        'Separe facilmente suas obras em "Lendo Atualmente", "Pretendo Ler (Desejos)" e "Já Lidos". Você também pode criar categorias personalizadas e importar seus livros via planilha CSV.',
      icon: (
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
          <Library className="w-8 h-8" />
        </div>
      ),
      highlightText: 'Filtre por etiquetas, categorias e acesse o diário de citações com 1 clique.',
      badge: 'Acervo',
    },
    {
      id: 2,
      title: 'Card "Lendo Atualmente"',
      subtitle: 'Dropdown seletor em ordem alfabética',
      description:
        'No topo do monitor de leitura, você encontra um menu suspenso de seleção rápida. Ao escolher qualquer livro em andamento, todo o card (capa, páginas, projeção de ritmo e botões) muda instantaneamente sem recarregar a tela.',
      icon: (
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
          <ListOrdered className="w-8 h-8" />
        </div>
      ),
      highlightText: 'Troque de leitura ativa imediatamente sem sair da página.',
      badge: 'Navegação Ágil',
    },
    {
      id: 3,
      title: 'Registro de Sessões & Edição',
      subtitle: 'Controle diário com histórico flexível',
      description:
        'Adicione páginas lidas com botões rápidos (+10, +20, +30 págs) ou atualize a página final. Se cometer algum engano, você pode editar ou excluir sessões passadas a qualquer momento diretamente no histórico!',
      icon: (
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
          <CalendarCheck className="w-8 h-8" />
        </div>
      ),
      highlightText: 'O ritmo diário e as projeções são recalculados automaticamente.',
      badge: 'Flexibilidade',
    },
    {
      id: 4,
      title: 'Metas e Projeções Inteligentes',
      subtitle: 'Previsões que se adaptam à sua rotina',
      description:
        'Descubra a data estimada em que você terminará cada livro com base no seu ritmo real dos últimos 7 dias. Personalize sua meta anual, ative lembretes sonoros e alterne entre modo claro e escuro nas Configurações.',
      icon: (
        <div className="w-16 h-16 rounded-3xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
          <TrendingUp className="w-8 h-8" />
        </div>
      ),
      highlightText: 'Tudo pronto para você ter o melhor ano literário da sua vida!',
      badge: 'Conclusão',
    },
  ];

  const step = steps[currentStep];

  const handleFinish = () => {
    try {
      const storageKey = `bookflow_onboarding_completed_${user?.id || 'default'}`;
      localStorage.setItem(storageKey, 'true');
    } catch {
      // fallback
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-6 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              {step.badge}
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              Passo {currentStep + 1} de {steps.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Pular tour e começar a usar"
          >
            Pular Tour
          </button>
        </div>

        {/* Body Content */}
        <div className="relative z-10 flex flex-col items-center text-center py-2">
          <div className="mb-5">{step.icon}</div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
            {step.title}
          </h3>

          <p className="text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400 mb-3">
            {step.subtitle}
          </p>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 max-w-md">
            {step.description}
          </p>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 max-w-sm w-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-medium">{step.highlightText}</span>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-6 flex items-center justify-between gap-3 relative z-10">
          {/* Step dots */}
          <div className="flex items-center gap-1.5" role="tablist">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`transition-all duration-200 rounded-full ${
                  idx === currentStep
                    ? 'w-6 h-2 bg-amber-500 dark:bg-amber-400'
                    : 'w-2 h-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
                title={`Ir para o passo ${idx + 1}`}
                aria-label={`Passo ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <span>{currentStep === steps.length - 1 ? 'Começar a Usar' : 'Próximo'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
