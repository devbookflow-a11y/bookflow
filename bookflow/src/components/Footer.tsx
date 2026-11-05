/**
 * @file Footer.tsx
 * @description Rodapé institucional limpo e minimalista do BookFlow.
 */

import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm transition-colors py-4 mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>
          © 2026 BookFlow Inc. Todos os direitos reservados. Desenvolvido para leitores apaixonados ❤️
        </p>
      </div>
    </footer>
  );
};
