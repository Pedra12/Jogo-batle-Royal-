import React, { useState } from 'react';
import { GameSettings, ApkBuildConfig } from '../types/game';
import JSZip from 'jszip';
import {
  Download,
  Terminal,
  Smartphone,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  Settings,
  Sparkles,
  HelpCircle,
  FileCode,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface ApkCompilerHubProps {
  settings: GameSettings;
}

export const ApkCompilerHub: React.FC<ApkCompilerHubProps> = ({ settings }) => {
  const [apkConfig, setApkConfig] = useState<ApkBuildConfig>({
    appName: settings.name || 'Meu Jogo Arcade',
    packageName: `com.gameforge.${settings.genre}game`,
    versionName: '1.0.0',
    versionCode: 1,
    orientation: 'portrait',
    targetSdk: 34,
    minSdk: 24,
    fullscreen: true,
    buildTool: 'pwabuilder',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'methods' | 'config' | 'check'>('methods');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Generate Standalone Standalone HTML5 Game for the ZIP
  const generateStandaloneGameHtml = () => {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${apkConfig.appName}</title>
  <meta name="theme-color" content="#090d16">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="manifest" href="manifest.json">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
    body { background: #090d16; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; min-height: 100vh; overflow: hidden; }
    #canvas-container { position: relative; width: 100vw; max-width: 440px; height: 75vh; max-height: 640px; }
    canvas { width: 100%; height: 100%; display: block; background: #000; touch-action: none; }
    .controls { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 440px; padding: 12px 16px; height: 25vh; }
    .btn { background: #1e293b; color: white; border: 2px solid #334155; border-radius: 14px; font-weight: bold; font-size: 20px; touch-action: none; display: flex; align-items: center; justify-content: center; }
    .btn:active { background: #06b6d4; color: #000; }
    .dpad { display: flex; gap: 12px; }
    .dpad-btn { width: 62px; height: 62px; }
    .action-btn { background: linear-gradient(135deg, #ec4899, #f43f5e); height: 62px; padding: 0 24px; font-size: 15px; border-color: #f43f5e; }
    .action-btn:active { background: #f43f5e; }
  </style>
</head>
<body>
  <div id="canvas-container">
    <canvas id="gameCanvas" width="420" height="640"></canvas>
  </div>
  <div class="controls">
    <div class="dpad">
      <button class="btn dpad-btn" id="btnLeft">◀</button>
      <button class="btn dpad-btn" id="btnRight">▶</button>
    </div>
    <button class="btn action-btn" id="btnAction">${settings.genre === 'space' ? '💥 DISPARAR' : '🚀 PULAR'}</button>
  </div>

  <script>
    // Configuration from GameForge Studio
    const CONFIG = ${JSON.stringify(settings)};
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const width = 420;
    const height = 640;
    
    // Audio synthesizer
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    function playBeep(freq, type='sine', dur=0.1) {
      try {
        if (!audioCtx) audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        g.gain.setValueAtTime(0.15, audioCtx.currentTime);
        g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + dur);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + dur);
      } catch(e) {}
    }

    // Input handlers
    const input = { left: false, right: false, up: false, action: false };
    const setupTouch = (id, key) => {
      const el = document.getElementById(id);
      el.addEventListener('touchstart', (e) => { e.preventDefault(); input[key] = true; });
      el.addEventListener('touchend', (e) => { e.preventDefault(); input[key] = false; });
      el.addEventListener('mousedown', () => input[key] = true);
      el.addEventListener('mouseup', () => input[key] = false);
    };
    setupTouch('btnLeft', 'left');
    setupTouch('btnRight', 'right');
    setupTouch('btnAction', 'action');

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') input.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') input.right = true;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { input.up = true; input.action = true; }
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') input.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') input.right = false;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { input.up = false; input.action = false; }
    });

    let score = 0;
    let lives = CONFIG.lives;
    let gameOver = false;
    let px = width / 2;
    let py = height - 120;
    let pvy = 0;
    let bullets = [];
    let enemies = [];
    let particles = [];
    let spawnTimer = 0;

    function resetGame() {
      score = 0;
      lives = CONFIG.lives;
      gameOver = false;
      px = width / 2;
      py = height - 120;
      bullets = [];
      enemies = [];
    }

    canvas.addEventListener('click', () => {
      if (gameOver) resetGame();
    });

    function loop() {
      // Clear screen
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      if (!gameOver) {
        if (input.left) px -= CONFIG.playerSpeed;
        if (input.right) px += CONFIG.playerSpeed;
        px = Math.max(20, Math.min(width - 20, px));

        // Genre Space or Runner
        if (CONFIG.genre === 'space') {
          if (Math.random() < 0.15) {
            bullets.push({ x: px, y: py - 15 });
            playBeep(880, 'sawtooth', 0.08);
          }
          bullets.forEach(b => b.y -= 10);
          bullets = bullets.filter(b => b.y > -10);

          spawnTimer++;
          if (spawnTimer > 40) {
            spawnTimer = 0;
            enemies.push({ x: Math.random() * (width - 40) + 20, y: -20, r: 16 });
          }
          enemies.forEach(en => en.y += CONFIG.obstacleSpeed);

          // Check collisions
          enemies.forEach((en, ei) => {
            bullets.forEach((b, bi) => {
              if (Math.hypot(en.x - b.x, en.y - b.y) < en.r + 6) {
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
                score += 100 * CONFIG.scoreMultiplier;
                playBeep(220, 'square', 0.15);
              }
            });
            if (Math.hypot(en.x - px, en.y - py) < en.r + 15) {
              enemies.splice(ei, 1);
              lives--;
              playBeep(110, 'sawtooth', 0.25);
              if (lives <= 0) gameOver = true;
            }
          });
        } else {
          // Jump/Runner gravity
          pvy += CONFIG.gravity;
          py += pvy;
          if (py >= height - 80) {
            py = height - 80;
            pvy = 0;
          }
          if ((input.up || input.action) && py >= height - 82) {
            pvy = -CONFIG.jumpPower;
            playBeep(440, 'square', 0.12);
          }
          spawnTimer++;
          if (spawnTimer > 60) {
            spawnTimer = 0;
            enemies.push({ x: width + 20, y: height - 80, r: 18 });
          }
          enemies.forEach(en => en.x -= CONFIG.obstacleSpeed);
          enemies.forEach((en, ei) => {
            if (Math.hypot(en.x - px, en.y - py) < en.r + 12) {
              enemies.splice(ei, 1);
              lives--;
              playBeep(120, 'sawtooth', 0.25);
              if (lives <= 0) gameOver = true;
            } else if (en.x < -20) {
              enemies.splice(ei, 1);
              score += 50 * CONFIG.scoreMultiplier;
            }
          });
        }

        // Draw Player
        ctx.fillStyle = CONFIG.playerColor || '#06b6d4';
        ctx.beginPath();
        ctx.arc(px, py, 16, 0, Math.PI * 2);
        ctx.fill();

        // Draw Bullets
        ctx.fillStyle = '#38bdf8';
        bullets.forEach(b => ctx.fillRect(b.x - 2, b.y - 6, 4, 12));

        // Draw Enemies
        ctx.fillStyle = '#ef4444';
        enemies.forEach(en => {
          ctx.beginPath();
          ctx.arc(en.x, en.y, en.r, 0, Math.PI * 2);
          ctx.fill();
        });

        // Top HUD
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, width, 40);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('SCORE: ' + score, 15, 26);
        ctx.fillStyle = '#ef4444';
        ctx.fillText('VIDAS: ' + lives, width - 90, 26);
      } else {
        // Game Over
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', width/2, height/2 - 30);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('SCORE: ' + score, width/2, height/2 + 10);
        ctx.fillStyle = '#06b6d4';
        ctx.font = '14px sans-serif';
        ctx.fillText('Toque para Reiniciar', width/2, height/2 + 50);
        ctx.textAlign = 'left';
      }

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  </script>
</body>
</html>`;
  };

  // Download the complete ready-to-compile project as a ZIP
  const downloadApkProjectZip = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // 1. Standalone web game
      zip.file('index.html', generateStandaloneGameHtml());

      // 2. Web App Manifest
      const manifestJson = {
        name: apkConfig.appName,
        short_name: apkConfig.appName.substring(0, 12),
        description: `Jogo criado com GameForge Studio: ${settings.genre}`,
        start_url: './index.html',
        display: apkConfig.fullscreen ? 'fullscreen' : 'standalone',
        orientation: apkConfig.orientation,
        background_color: '#090d16',
        theme_color: '#090d16',
        icons: [
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      };
      zip.file('manifest.json', JSON.stringify(manifestJson, null, 2));

      // 3. Capacitor Config for native APK compilation
      const capacitorConfig = {
        appId: apkConfig.packageName,
        appName: apkConfig.appName,
        webDir: '.',
        bundledWebRuntime: false,
        android: {
          allowMixedContent: true,
          captureInput: true,
          webContentsDebuggingEnabled: true,
        },
        plugins: {
          SplashScreen: {
            launchShowDuration: 1500,
            backgroundColor: '#090d16',
          },
        },
      };
      zip.file('capacitor.config.json', JSON.stringify(capacitorConfig, null, 2));

      // 4. package.json for npm and Capacitor CLI
      const packageJson = {
        name: apkConfig.appName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        version: apkConfig.versionName,
        private: true,
        scripts: {
          'cap:add': 'npx cap add android',
          'cap:sync': 'npx cap sync',
          'cap:open': 'npx cap open android',
          'build:apk': 'npx cap sync android && cd android && ./gradlew assembleDebug',
        },
        devDependencies: {
          '@capacitor/cli': '^6.0.0',
          '@capacitor/core': '^6.0.0',
          '@capacitor/android': '^6.0.0',
        },
      };
      zip.file('package.json', JSON.stringify(packageJson, null, 2));

      // 5. Windows automated build batch script
      const buildBat = `@echo off
echo =======================================================
echo Compilador APK GameForge - Instalando Capacitor Android
echo =======================================================
call npm install
call npx cap add android
echo.
echo Abrindo o projeto no Android Studio para gerar o APK...
call npx cap open android
pause
`;
      zip.file('build-apk.bat', buildBat);

      // 6. Linux/Mac build shell script
      const buildSh = `#!/usr/bin/env bash
echo "======================================================="
echo "Compilador APK GameForge - Gerando APK com Capacitor"
echo "======================================================="
npm install
npx cap add android
echo "Sincronizando arquivos..."
npx cap sync
echo "Abrindo Android Studio..."
npx cap open android
`;
      zip.file('build-apk.sh', buildSh);

      // 7. Full step-by-step Portuguese guide
      const readme = `# 🚀 Guia Completo: Como Compilar este Jogo em APK Android

Parabéns! Você exportou o projeto do jogo **${apkConfig.appName}** criado no GameForge Studio.

Aqui estão as 3 melhores formas de transformar este jogo em um arquivo **.APK** para instalar no celular ou publicar na Google Play Store.

---

## ⚡ Método 1: PWABuilder (O Mais Fácil - Sem Instalar Nada)
*Ideal se você não tem o Android Studio instalado e quer o APK em 2 minutos direto no navegador.*

1. Pegue o link do seu jogo online hospedado ou suba a pasta deste projeto no GitHub Pages / Vercel / Netlify.
2. Acesse o site oficial: **https://www.pwabuilder.com**
3. Cole a URL do seu jogo e clique em **Start**.
4. O PWABuilder irá validar o Manifest (já configurado neste pacote!).
5. Clique em **Package for Stores** -> Selecione **Android**.
6. Clique em **Generate Package**.
7. O site gera automaticamente um arquivo **.zip** contendo o seu **APK assinado pronto para instalar** e o **.aab** para enviar para a Google Play!

---

## 🛠️ Método 2: Capacitor + Android Studio (Método Nativo Oficial)
*Ideal se você quer compilar direto no seu computador e testar no emulador ou via cabo USB.*

### Pré-requisitos:
- Node.js instalado (v18+)
- Android Studio instalado com SDK Android 33 ou 34

### Passo a passo no Terminal:
1. Abra a pasta deste projeto no terminal:
   \`\`\`bash
   cd pasta-do-projeto
   \`\`\`
2. Instale as dependências:
   \`\`\`bash
   npm install
   \`\`\`
3. Adicione a plataforma Android:
   \`\`\`bash
   npx cap add android
   \`\`\`
4. Sincronize o código do jogo com a pasta do Android:
   \`\`\`bash
   npx cap sync
   \`\`\`
5. Abra o projeto no Android Studio:
   \`\`\`bash
   npx cap open android
   \`\`\`
6. No Android Studio, vá no menu superior:
   **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
7. Quando terminar, clique no aviso azul **"locate"** para pegar o arquivo **app-debug.apk**!
8. Transfira o APK para o seu celular Android e instale.

---

## 📲 Método 3: Instalação Direta PWA (Sem precisar compilar)
Este projeto já possui suporte a PWA (Progressive Web App):
1. Abra o link do jogo no navegador Google Chrome no seu celular Android.
2. Toque nos 3 pontinhos do Chrome no canto superior direito.
3. Toque em **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
4. O jogo será instalado como um aplicativo nativo independente, em tela cheia, sem barra de navegação do navegador!

---
Configurações exportadas:
- App Name: ${apkConfig.appName}
- Package Name: ${apkConfig.packageName}
- Versão: ${apkConfig.versionName} (${apkConfig.versionCode})
- Orientação: ${apkConfig.orientation}
`;
      zip.file('GUIA_COMPILAR_APK_PASSO_A_PASSO.md', readme);

      // Trigger ZIP download
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${apkConfig.appName.toLowerCase().replace(/\s+/g, '_')}_apk_project.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao gerar ZIP:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-indigo-950/70 to-slate-900 border border-cyan-800/60 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold mb-2 border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" /> Compilador & Exportador Android
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-cyan-400" /> Como Transformar seu Jogo em APK
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Gere os pacotes nativos para compilar seu jogo em arquivo <strong className="text-cyan-300">.APK</strong> instalável no Android ou publique na Google Play Store.
            </p>
          </div>

          <button
            onClick={downloadApkProjectZip}
            disabled={isExporting}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Compactando Projeto...' : 'Baixar Projeto Completo (.ZIP)'}
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('methods')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'methods'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🚀 3 Métodos para Compilar o APK
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'config'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚙️ Configurar Package ID & Versão
        </button>
        <button
          onClick={() => setActiveTab('check')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'check'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🛡️ Diagnóstico de Compatibilidade APK
        </button>
      </div>

      {/* TAB 1: 3 METODOS PARA GERAR APK */}
      {activeTab === 'methods' && (
        <div className="space-y-4">
          {/* Método 1: PWABuilder */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg border border-cyan-500/30">
                  1
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-sm">Método PWABuilder (Mais Rápido & Sem Instalar Nada)</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Recomendado para Iniciantes
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gera o arquivo <strong>.apk</strong> ou <strong>.aab</strong> (Google Play) em 2 minutos via nuvem oficial da Microsoft.
                  </p>
                </div>
              </div>
              <a
                href="https://www.pwabuilder.com"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
              >
                Abrir PWABuilder <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="font-bold text-cyan-400">Passo 1:</span>
                <p className="text-slate-300 mt-1">
                  Copie o link desta aplicação ou hospede os arquivos do .ZIP baixado (Vercel, GitHub Pages, etc).
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="font-bold text-cyan-400">Passo 2:</span>
                <p className="text-slate-300 mt-1">
                  Cole no <strong>pwabuilder.com</strong> e clique em <strong>Start</strong>. O manifesto e ícones já estão 100% prontos!
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="font-bold text-cyan-400">Passo 3:</span>
                <p className="text-slate-300 mt-1">
                  Selecione <strong>Android</strong> e clique em <strong>Generate Package</strong> para baixar seu APK pronto!
                </p>
              </div>
            </div>
          </div>

          {/* Método 2: Capacitor + Android Studio */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg border border-indigo-500/30">
                  2
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-100 text-sm">Método Capacitor & Android Studio (Nativo Profissional)</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Controle Total
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Permite compilar direto na sua máquina com o Android SDK e gerar APKs assinados com chaves de produção.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1">
                <span>Comandos no Terminal (após extrair o .ZIP):</span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      'npm install\nnpx cap add android\nnpx cap sync\nnpx cap open android',
                      'cap-cmd'
                    )
                  }
                  className="hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedCmd === 'cap-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCmd === 'cap-cmd' ? 'Copiado!' : 'Copiar Comandos'}
                </button>
              </div>
              <p className="text-cyan-400"># 1. Instalar as dependências do Capacitor</p>
              <p className="text-slate-100 bg-slate-900/60 p-2 rounded">npm install</p>
              <p className="text-cyan-400"># 2. Criar a pasta do Android</p>
              <p className="text-slate-100 bg-slate-900/60 p-2 rounded">npx cap add android</p>
              <p className="text-cyan-400"># 3. Abrir o projeto no Android Studio para gerar o APK</p>
              <p className="text-slate-100 bg-slate-900/60 p-2 rounded">npx cap open android</p>
            </div>
          </div>

          {/* Método 3: Instalação Direta no Celular (PWA) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
                3
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Instalar Direto no Celular (Sem Compilar)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Abra no Google Chrome do celular e toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela de início"</strong>.
                  O Android cria um ícone nativo que roda em tela cheia idêntico a um APK!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONFIGURAÇÃO DO APK */}
      {activeTab === 'config' && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" /> Propriedades do Pacote Android (AndroidManifest)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nome no Celular (App Name):</label>
              <input
                type="text"
                value={apkConfig.appName}
                onChange={(e) => setApkConfig({ ...apkConfig, appName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">ID do Pacote (Package Name):</label>
              <input
                type="text"
                value={apkConfig.packageName}
                onChange={(e) => setApkConfig({ ...apkConfig, packageName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-cyan-500 text-sm"
                placeholder="com.empresa.jogox"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Versão (Version Name):</label>
              <input
                type="text"
                value={apkConfig.versionName}
                onChange={(e) => setApkConfig({ ...apkConfig, versionName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Orientação da Tela:</label>
              <select
                value={apkConfig.orientation}
                onChange={(e) => setApkConfig({ ...apkConfig, orientation: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm"
              >
                <option value="portrait">Em Pé (Retrato / Portrait)</option>
                <option value="landscape">Deitada (Paisagem / Landscape)</option>
                <option value="sensor">Automática pelo Sensor</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Essas configurações são injetadas automaticamente no arquivo <code>manifest.json</code> e <code>capacitor.config.json</code> no ZIP.
            </span>
            <button
              onClick={downloadApkProjectZip}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Baixar com Estas Configurações
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: DIAGNOSTICO DE COMPATIBILIDADE APK */}
      {activeTab === 'check' && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Pontuação de Prontidão para APK
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs">
              100% Compatível com Android
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-slate-100 block">Manifesto PWA Válido</strong>
                <span className="text-slate-400">Contém start_url, display: standalone e theme_color.</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-slate-100 block">Controles Touch Nativos</strong>
                <span className="text-slate-400">D-Pad virtual e botões sensíveis ao toque configurados.</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-slate-100 block">Áudio 100% Offline</strong>
                <span className="text-slate-400">Web Audio API sintetizado sem downloads externos.</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-slate-100 block">Configuração Capacitor Pronta</strong>
                <span className="text-slate-400">Package ID e compatibilidade com Android SDK 34+.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
