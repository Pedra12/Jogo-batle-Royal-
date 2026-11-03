import React from 'react';
import { GameSettings, GameGenre } from '../types/game';
import { Sliders, Sparkles, Shield, Rocket, Activity, Zap, Palette, Flame } from 'lucide-react';

interface GameStudioProps {
  settings: GameSettings;
  onChange: (newSettings: GameSettings) => void;
  onSelectGenre: (genre: GameGenre) => void;
}

export const GameStudio: React.FC<GameStudioProps> = ({
  settings,
  onChange,
  onSelectGenre,
}) => {
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  const applyPreset = (preset: 'casual' | 'balanced' | 'hardcore' | 'hyper') => {
    if (preset === 'casual') {
      onChange({
        ...settings,
        playerSpeed: 7,
        gravity: 0.5,
        jumpPower: 14,
        obstacleSpeed: 3,
        spawnRate: 2,
        lives: 5,
        scoreMultiplier: 1,
      });
    } else if (preset === 'balanced') {
      onChange({
        ...settings,
        playerSpeed: 6,
        gravity: 0.65,
        jumpPower: 12,
        obstacleSpeed: 4.5,
        spawnRate: 3,
        lives: 3,
        scoreMultiplier: 1.5,
      });
    } else if (preset === 'hardcore') {
      onChange({
        ...settings,
        playerSpeed: 8,
        gravity: 0.8,
        jumpPower: 13,
        obstacleSpeed: 7,
        spawnRate: 4,
        lives: 1,
        scoreMultiplier: 2.5,
      });
    } else if (preset === 'hyper') {
      onChange({
        ...settings,
        playerSpeed: 11,
        gravity: 1.1,
        jumpPower: 16,
        obstacleSpeed: 9,
        spawnRate: 5,
        lives: 2,
        scoreMultiplier: 4,
      });
    }
  };

  const colorOptions = [
    { label: 'Ciano Cyber', hex: '#06b6d4' },
    { label: 'Índigo Neon', hex: '#6366f1' },
    { label: 'Rosa Shock', hex: '#ec4899' },
    { label: 'Esmeralda', hex: '#10b981' },
    { label: 'Âmbar Solar', hex: '#f59e0b' },
    { label: 'Rubi Laser', hex: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Escolha do Gênero do Jogo */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Rocket className="w-4 h-4 text-cyan-400" /> 1. Escolha o Gênero do Jogo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onSelectGenre('space')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              settings.genre === 'space'
                ? 'bg-cyan-950/60 border-cyan-500 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <div className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>🚀</span> Space Defender
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Batalha arcade no espaço, tiro a laser, asteroides e naves alienígenas.
            </p>
          </button>

          <button
            onClick={() => onSelectGenre('jump')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              settings.genre === 'jump'
                ? 'bg-purple-950/60 border-purple-500 shadow-md shadow-purple-500/20'
                : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <div className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>🪐</span> Cyber Jump
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Plataformas verticais dinâmicas, molas de turbo, moedas e subida infinita.
            </p>
          </button>

          <button
            onClick={() => onSelectGenre('runner')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              settings.genre === 'runner'
                ? 'bg-pink-950/60 border-pink-500 shadow-md shadow-pink-500/20'
                : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
            }`}
          >
            <div className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>⚡</span> Neon Runner
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Corrida lateral sem fim, pulo duplo, obstáculos com espinhos e microchips.
            </p>
          </button>
        </div>
      </div>

      {/* 2. Nome & Aparência do Jogo */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-pink-400" /> 2. Identidade & Visual
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Jogo:</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateSetting('name', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-medium"
              placeholder="Ex: Cyber Galaxy 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tema Visual:</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 text-sm font-medium"
            >
              <option value="cyberpunk">Cyberpunk Neon (Violeta & Rosa)</option>
              <option value="retro-space">Espaço Retro 80s (Azul & Estrelas)</option>
              <option value="neon-arcade">Arcade Matrix (Verde & Ciano)</option>
              <option value="pixel-adventure">Pixel Adventure (Escuro Clássico)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-2">Cor do Personagem / Nave:</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => updateSetting('playerColor', c.hex)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                    settings.playerColor === c.hex
                      ? 'border-white ring-2 ring-white/30 text-white'
                      : 'border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                  style={{ backgroundColor: `${c.hex}22` }}
                >
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: c.hex }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dificuldade & Predefinições Rápidas */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> 3. Modos Pré-definidos
          </h3>
          <span className="text-xs text-slate-400">Clique para calibrar rápido</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => applyPreset('casual')}
            className="py-2 px-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/40 text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
          >
            🛡️ Casual (5 Vidas)
          </button>
          <button
            onClick={() => applyPreset('balanced')}
            className="py-2 px-3 rounded-lg bg-cyan-950/40 border border-cyan-800/60 hover:bg-cyan-900/40 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
          >
            ⚖️ Equilibrado
          </button>
          <button
            onClick={() => applyPreset('hardcore')}
            className="py-2 px-3 rounded-lg bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/40 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
          >
            💀 Hardcore (1 Vida)
          </button>
          <button
            onClick={() => applyPreset('hyper')}
            className="py-2 px-3 rounded-lg bg-amber-950/40 border border-amber-800/60 hover:bg-amber-900/40 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
          >
            ⚡ Turbo Insano
          </button>
        </div>
      </div>

      {/* 4. Física do Jogo & Parâmetros Detalhados */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-400" /> 4. Parâmetros de Física & Gameplay
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Velocidade do Jogador */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Velocidade do Jogador</span>
              <span className="font-mono text-cyan-400 font-bold">{settings.playerSpeed}x</span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="1"
              value={settings.playerSpeed}
              onChange={(e) => updateSetting('playerSpeed', Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Força do Pulo / Manobra */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Força de Pulo / Agilidade</span>
              <span className="font-mono text-purple-400 font-bold">{settings.jumpPower}</span>
            </div>
            <input
              type="range"
              min="8"
              max="20"
              step="1"
              value={settings.jumpPower}
              onChange={(e) => updateSetting('jumpPower', Number(e.target.value))}
              className="w-full accent-purple-400 cursor-pointer"
            />
          </div>

          {/* Velocidade dos Inimigos / Obstáculos */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Velocidade dos Obstáculos</span>
              <span className="font-mono text-rose-400 font-bold">{settings.obstacleSpeed} km/h</span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              step="0.5"
              value={settings.obstacleSpeed}
              onChange={(e) => updateSetting('obstacleSpeed', Number(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer"
            />
          </div>

          {/* Taxa de Geração (Spawn) */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Frequência de Inimigos</span>
              <span className="font-mono text-amber-400 font-bold">Nível {settings.spawnRate}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={settings.spawnRate}
              onChange={(e) => updateSetting('spawnRate', Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Vidas Iniciais */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Vidas Iniciais</span>
              <span className="font-mono text-rose-400 font-bold">{settings.lives} vidas</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={settings.lives}
              onChange={(e) => updateSetting('lives', Number(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer"
            />
          </div>

          {/* Multiplicador de Pontos */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Multiplicador de Pontuação</span>
              <span className="font-mono text-emerald-400 font-bold">{settings.scoreMultiplier}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={settings.scoreMultiplier}
              onChange={(e) => updateSetting('scoreMultiplier', Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
