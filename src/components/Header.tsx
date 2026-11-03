import React from 'react';
import { Gamepad2, Sliders, Smartphone, Download, Sparkles, Monitor } from 'lucide-react';

export type AppView = 'play' | 'studio' | 'compiler';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  isMobileFrame,
  onToggleMobileFrame,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950">
            <Gamepad2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white">
                GameForge <span className="text-cyan-400">Studio</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                APK Ready
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Crie jogos 2D e exporte o código compilável para APK Android
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => onViewChange('play')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentView === 'play'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" /> Jogar & Testar
          </button>

          <button
            onClick={() => onViewChange('studio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentView === 'studio'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Personalizar Jogo
          </button>

          <button
            onClick={() => onViewChange('compiler')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentView === 'compiler'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Compilar APK
          </button>
        </div>

        {/* Frame Toggle */}
        <div className="hidden lg:flex items-center">
          <button
            onClick={onToggleMobileFrame}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isMobileFrame
                ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Alternar moldura de smartphone"
          >
            {isMobileFrame ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Modo Celular
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5" /> Modo Expandido
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
