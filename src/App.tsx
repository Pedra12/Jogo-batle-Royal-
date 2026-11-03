import React, { useState } from 'react';
import { GameSettings, GameGenre } from './types/game';
import { GameCanvas } from './components/GameCanvas';
import { GameStudio } from './components/GameStudio';
import { ApkCompilerHub } from './components/ApkCompilerHub';
import { Header, AppView } from './components/Header';
import {
  Sparkles,
  Gamepad2,
  Sliders,
  Download,
  Share2,
  Trophy,
  Smartphone,
  Info,
  Check,
} from 'lucide-react';

const defaultGames: Record<GameGenre, GameSettings> = {
  space: {
    id: 'space_defender',
    name: 'Space Defender Arcade',
    genre: 'space',
    theme: 'retro-space',
    playerSpeed: 6,
    gravity: 0.5,
    jumpPower: 12,
    obstacleSpeed: 4.5,
    spawnRate: 3,
    playerColor: '#06b6d4',
    playerSprite: 'ship',
    lives: 3,
    soundEnabled: true,
    scoreMultiplier: 1,
  },
  jump: {
    id: 'cyber_jump',
    name: 'Cyber Jump Infinite',
    genre: 'jump',
    theme: 'cyberpunk',
    playerSpeed: 6.5,
    gravity: 0.6,
    jumpPower: 13,
    obstacleSpeed: 3,
    spawnRate: 3,
    playerColor: '#a855f7',
    playerSprite: 'droid',
    lives: 1,
    soundEnabled: true,
    scoreMultiplier: 1.5,
  },
  runner: {
    id: 'neon_runner',
    name: 'Neon Runner 2099',
    genre: 'runner',
    theme: 'neon-arcade',
    playerSpeed: 7,
    gravity: 0.7,
    jumpPower: 13.5,
    obstacleSpeed: 5.5,
    spawnRate: 3,
    playerColor: '#ec4899',
    playerSprite: 'hero',
    lives: 3,
    soundEnabled: true,
    scoreMultiplier: 2,
  },
};

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('play');
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>(defaultGames.space);

  const handleSelectGenre = (genre: GameGenre) => {
    setGameSettings({
      ...defaultGames[genre],
      name: gameSettings.name.includes('Arcade')
        ? defaultGames[genre].name
        : gameSettings.name,
    });
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        isMobileFrame={isMobileFrame}
        onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        {/* VIEW 1: JOGAR & TESTAR */}
        {currentView === 'play' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Game Canvas and Controls */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div
                className={
                  isMobileFrame
                    ? 'p-4 rounded-[40px] bg-slate-900 border-4 border-slate-700 shadow-2xl shadow-cyan-500/10'
                    : 'w-full'
                }
              >
                {isMobileFrame && (
                  <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />
                )}

                <GameCanvas
                  settings={gameSettings}
                  isMobileSim={isMobileFrame}
                />
              </div>
            </div>

            {/* Right Column: Quick Game Details & Quick Actions */}
            <div className="lg:col-span-5 space-y-4">
              {/* Quick Game Switcher */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Jogos Rápidos para Testar:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSelectGenre('space')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      gameSettings.genre === 'space'
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-sm'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    🚀 Espaço
                  </button>
                  <button
                    onClick={() => handleSelectGenre('jump')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      gameSettings.genre === 'jump'
                        ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-sm'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    🪐 Pulo
                  </button>
                  <button
                    onClick={() => handleSelectGenre('runner')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                      gameSettings.genre === 'runner'
                        ? 'bg-pink-950 border-pink-500 text-pink-300 shadow-sm'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    ⚡ Corrida
                  </button>
                </div>
              </div>

              {/* Game Stats Card */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" /> Detalhes da Partida
                  </h3>
                  <span className="text-xs text-cyan-400 font-mono">
                    Gênero: {gameSettings.genre.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400 block">Velocidade:</span>
                    <span className="font-bold text-slate-200">{gameSettings.playerSpeed}x</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400 block">Vidas:</span>
                    <span className="font-bold text-rose-400">{gameSettings.lives} ❤️</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400 block">Dificuldade:</span>
                    <span className="font-bold text-amber-400">Nível {gameSettings.spawnRate}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400 block">Multiplicador:</span>
                    <span className="font-bold text-emerald-400">{gameSettings.scoreMultiplier}x</span>
                  </div>
                </div>

                {/* Direct Action buttons */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => setCurrentView('studio')}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Editar Física, Personagens & Cores
                  </button>

                  <button
                    onClick={() => setCurrentView('compiler')}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Compilar este Jogo em APK Android
                  </button>
                </div>
              </div>

              {/* Informative helper box */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Dica para Celular:</strong> Você pode usar tanto os botões virtuais touchscreen na parte inferior quanto as setas do teclado. O jogo funciona 100% offline.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: PERSONALIZAR JOGO */}
        {currentView === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <GameStudio
                settings={gameSettings}
                onChange={setGameSettings}
                onSelectGenre={handleSelectGenre}
              />
            </div>

            <div className="lg:col-span-5 sticky top-20">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-cyan-400" /> Teste Rápido em Tempo Real
                  </h3>
                  <button
                    onClick={() => setCurrentView('play')}
                    className="text-xs text-cyan-400 hover:underline font-semibold cursor-pointer"
                  >
                    Abrir em Tela Cheia →
                  </button>
                </div>
                <GameCanvas settings={gameSettings} />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: COMPILAR APK & EXPORTAR */}
        {currentView === 'compiler' && (
          <ApkCompilerHub settings={gameSettings} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 mt-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>GameForge Studio — Motor de Jogos 2D Web & Exportador APK Android.</p>
          <p className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            Compatível com Capacitor, Cordova, PWABuilder e Android Studio
          </p>
        </div>
      </footer>
    </div>
  );
}
