import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameSettings } from '../types/game';
import { sounds } from '../audio/soundEffects';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Volume2, VolumeX, Maximize2, Shield, Heart } from 'lucide-react';

interface GameCanvasProps {
  settings: GameSettings;
  onGameOver?: (score: number) => void;
  isMobileSim?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  settings,
  onGameOver,
  isMobileSim = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem(`gf_highscore_${settings.id}`) || '0', 10);
  });
  const [currentLives, setCurrentLives] = useState(settings.lives);
  const [soundMuted, setSoundMuted] = useState(!settings.soundEnabled);

  // Input states
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const touchInputRef = useRef<{ left: boolean; right: boolean; up: boolean; down: boolean; action: boolean }>({
    left: false,
    right: false,
    up: false,
    down: false,
    action: false,
  });

  // Keep sound state in sync
  useEffect(() => {
    sounds.enabled = !soundMuted;
  }, [soundMuted]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update high score if changed in storage
  useEffect(() => {
    setHighScore(parseInt(localStorage.getItem(`gf_highscore_${settings.id}`) || '0', 10));
    setCurrentLives(settings.lives);
    setGameState('idle');
    setScore(0);
  }, [settings.id, settings.lives]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setCurrentLives(settings.lives);
    sounds.playClick();
  }, [settings.lives]);

  // Main Game Loop using Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let localScore = 0;
    let localLives = settings.lives;
    let gameOverHandled = false;

    // Dimensions
    const width = 420;
    const height = 640;
    canvas.width = width;
    canvas.height = height;

    // Common Game Entities
    const particles: Particle[] = [];

    // Helper for particles
    const addExplosion = (x: number, y: number, color: string, count = 16) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: Math.random() * 20 + 20,
          color,
          size: Math.random() * 4 + 2,
        });
      }
    };

    // Genre-specific entity variables
    // 1. SPACE DEFENDER
    let shipX = width / 2;
    let shipY = height - 80;
    const bullets: { x: number; y: number; vy: number }[] = [];
    const enemies: { x: number; y: number; vx: number; vy: number; radius: number; hp: number; type: 'asteroid' | 'saucer' }[] = [];
    let lastShotTime = 0;
    let enemySpawnCounter = 0;

    // 2. CYBER JUMP
    let jumpPlayerX = width / 2;
    let jumpPlayerY = height - 150;
    let jumpVy = 0;
    let cameraY = 0;
    interface Platform {
      x: number;
      y: number;
      w: number;
      h: number;
      type: 'normal' | 'moving' | 'spring';
      vx: number;
      hasCoin?: boolean;
    }
    const platforms: Platform[] = [
      { x: width / 2 - 50, y: height - 60, w: 100, h: 14, type: 'normal', vx: 0 },
      { x: 100, y: height - 160, w: 80, h: 14, type: 'normal', vx: 0, hasCoin: true },
      { x: 260, y: height - 250, w: 80, h: 14, type: 'moving', vx: 2 },
      { x: 120, y: height - 360, w: 80, h: 14, type: 'spring', vx: 0 },
      { x: 220, y: height - 470, w: 80, h: 14, type: 'normal', vx: 0, hasCoin: true },
      { x: 80, y: height - 580, w: 80, h: 14, type: 'moving', vx: -2 },
    ];
    let highestY = height - 150;

    // 3. NEON RUNNER
    let runnerX = 60;
    let runnerY = height - 110;
    let runnerVy = 0;
    let isGrounded = true;
    let jumpCount = 0;
    const runnerObstacles: { x: number; y: number; w: number; h: number; type: 'spike' | 'drone' | 'chip' }[] = [];
    let runnerObstacleTimer = 0;
    let floorOffset = 0;

    // Stars / Background grid
    const stars = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.7 + 0.3,
    }));

    const render = () => {
      // 1. Clear background
      if (settings.theme === 'cyberpunk') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#090919');
        bgGrad.addColorStop(1, '#1b0d2a');
        ctx.fillStyle = bgGrad;
      } else if (settings.theme === 'retro-space') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#040714');
        bgGrad.addColorStop(1, '#0c102b');
        ctx.fillStyle = bgGrad;
      } else if (settings.theme === 'neon-arcade') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#0a1917');
        bgGrad.addColorStop(1, '#062024');
        ctx.fillStyle = bgGrad;
      } else {
        ctx.fillStyle = '#0f172a';
      }
      ctx.fillRect(0, 0, width, height);

      // Starfield / Grid background animation
      ctx.save();
      stars.forEach((s) => {
        s.y += s.speed * (settings.obstacleSpeed / 5);
        if (s.y > height) {
          s.y = 0;
          s.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Read Inputs (combining keyboard and on-screen touch)
      const isLeft = keysRef.current['ArrowLeft'] || keysRef.current['KeyA'] || touchInputRef.current.left;
      const isRight = keysRef.current['ArrowRight'] || keysRef.current['KeyD'] || touchInputRef.current.right;
      const isUp = keysRef.current['ArrowUp'] || keysRef.current['KeyW'] || touchInputRef.current.up;
      const isDown = keysRef.current['ArrowDown'] || keysRef.current['KeyS'] || touchInputRef.current.down;
      const isAction = keysRef.current['Space'] || keysRef.current['KeyZ'] || touchInputRef.current.action;

      // ==========================================
      // GAMEPLAY LOGIC PER GENRE
      // ==========================================
      if (gameState === 'playing') {
        if (settings.genre === 'space') {
          // --- SPACE DEFENDER LOGIC ---
          const moveSpeed = settings.playerSpeed;
          if (isLeft) shipX -= moveSpeed;
          if (isRight) shipX += moveSpeed;
          if (isUp) shipY -= moveSpeed * 0.7;
          if (isDown) shipY += moveSpeed * 0.7;

          // Clamping
          shipX = Math.max(24, Math.min(width - 24, shipX));
          shipY = Math.max(80, Math.min(height - 40, shipY));

          // Firing (auto or action button)
          const now = Date.now();
          if ((isAction || true) && now - lastShotTime > 260 / (settings.playerSpeed / 4)) {
            bullets.push({ x: shipX, y: shipY - 18, vy: -10 });
            sounds.playLaser();
            lastShotTime = now;
          }

          // Bullets update & draw
          for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.y += b.vy;

            // Draw bullet
            ctx.save();
            ctx.fillStyle = '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0284c7';
            ctx.fillRect(b.x - 2.5, b.y - 8, 5, 14);
            ctx.restore();

            if (b.y < -20) {
              bullets.splice(i, 1);
            }
          }

          // Enemy Spawner
          enemySpawnCounter++;
          const spawnInterval = Math.max(30, 90 - settings.spawnRate * 12);
          if (enemySpawnCounter > spawnInterval) {
            enemySpawnCounter = 0;
            const isSaucer = Math.random() > 0.6;
            enemies.push({
              x: Math.random() * (width - 60) + 30,
              y: -30,
              vx: isSaucer ? (Math.random() - 0.5) * 3 : (Math.random() - 0.5) * 1.5,
              vy: (Math.random() * 2 + settings.obstacleSpeed * 0.6),
              radius: isSaucer ? 18 : Math.random() * 12 + 14,
              hp: isSaucer ? 2 : 1,
              type: isSaucer ? 'saucer' : 'asteroid',
            });
          }

          // Enemies update & collisions
          for (let i = enemies.length - 1; i >= 0; i--) {
            const en = enemies[i];
            en.x += en.vx;
            en.y += en.vy;

            // Bounce off sides
            if (en.x < en.radius || en.x > width - en.radius) {
              en.vx *= -1;
            }

            // Draw Enemy
            ctx.save();
            if (en.type === 'asteroid') {
              ctx.fillStyle = '#94a3b8';
              ctx.strokeStyle = '#64748b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(en.x, en.y, en.radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            } else {
              // Saucer
              ctx.fillStyle = '#f43f5e';
              ctx.shadowColor = '#f43f5e';
              ctx.shadowBlur = 8;
              ctx.beginPath();
              ctx.ellipse(en.x, en.y, en.radius * 1.3, en.radius * 0.7, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#38bdf8';
              ctx.beginPath();
              ctx.arc(en.x, en.y - 4, en.radius * 0.45, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();

            // Check collision with bullets
            for (let j = bullets.length - 1; j >= 0; j--) {
              const b = bullets[j];
              const dist = Math.hypot(en.x - b.x, en.y - b.y);
              if (dist < en.radius + 6) {
                bullets.splice(j, 1);
                en.hp--;
                addExplosion(b.x, b.y, '#38bdf8', 6);
                if (en.hp <= 0) {
                  addExplosion(en.x, en.y, en.type === 'saucer' ? '#f43f5e' : '#f59e0b', 20);
                  sounds.playExplosion();
                  const earned = (en.type === 'saucer' ? 250 : 100) * settings.scoreMultiplier;
                  localScore += earned;
                  setScore(localScore);
                  enemies.splice(i, 1);
                  break;
                }
              }
            }

            // Check collision with player ship
            if (enemies[i]) {
              const pDist = Math.hypot(en.x - shipX, en.y - shipY);
              if (pDist < en.radius + 18) {
                enemies.splice(i, 1);
                addExplosion(shipX, shipY, '#ef4444', 28);
                sounds.playExplosion();
                localLives--;
                setCurrentLives(localLives);
                if (localLives <= 0) {
                  triggerGameOver(localScore);
                }
              } else if (en.y > height + 40) {
                enemies.splice(i, 1);
              }
            }
          }

          // Draw Player Ship
          ctx.save();
          ctx.translate(shipX, shipY);
          // Engine flame
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-7, 16);
          ctx.lineTo(0, 26 + Math.random() * 8);
          ctx.lineTo(7, 16);
          ctx.fill();

          // Body
          ctx.fillStyle = settings.playerColor || '#6366f1';
          ctx.shadowBlur = 12;
          ctx.shadowColor = settings.playerColor || '#6366f1';
          ctx.beginPath();
          ctx.moveTo(0, -22);
          ctx.lineTo(18, 16);
          ctx.lineTo(6, 12);
          ctx.lineTo(0, 16);
          ctx.lineTo(-6, 12);
          ctx.lineTo(-18, 16);
          ctx.closePath();
          ctx.fill();

          // Cockpit glass
          ctx.fillStyle = '#e0e7ff';
          ctx.beginPath();
          ctx.ellipse(0, -2, 4, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

        } else if (settings.genre === 'jump') {
          // --- CYBER JUMP LOGIC ---
          // Horizontal movement
          if (isLeft) jumpPlayerX -= settings.playerSpeed;
          if (isRight) jumpPlayerX += settings.playerSpeed;

          // Wrap around screen
          if (jumpPlayerX < -15) jumpPlayerX = width + 10;
          if (jumpPlayerX > width + 15) jumpPlayerX = -10;

          // Gravity & movement
          jumpVy += settings.gravity;
          jumpPlayerY += jumpVy;

          // Camera scrolling when player rises above middle
          if (jumpPlayerY < height / 2) {
            const diff = height / 2 - jumpPlayerY;
            jumpPlayerY = height / 2;
            cameraY += diff;

            // Update highest score based on height climbed
            const heightClimbed = Math.floor(cameraY / 10) * settings.scoreMultiplier;
            if (heightClimbed > localScore) {
              localScore = heightClimbed;
              setScore(localScore);
            }

            // Move platforms down with camera
            platforms.forEach((p) => {
              p.y += diff;
            });
          }

          // Platform update and spawn
          for (let i = platforms.length - 1; i >= 0; i--) {
            const p = platforms[i];
            if (p.type === 'moving') {
              p.x += p.vx;
              if (p.x < 10 || p.x + p.w > width - 10) p.vx *= -1;
            }

            // Draw Platform
            ctx.save();
            if (p.type === 'spring') {
              ctx.fillStyle = '#10b981';
              ctx.shadowColor = '#10b981';
            } else if (p.type === 'moving') {
              ctx.fillStyle = '#38bdf8';
              ctx.shadowColor = '#38bdf8';
            } else {
              ctx.fillStyle = '#a855f7';
              ctx.shadowColor = '#a855f7';
            }
            ctx.shadowBlur = 8;
            ctx.fillRect(p.x, p.y, p.w, p.h);

            // Draw spring icon if spring
            if (p.type === 'spring') {
              ctx.fillStyle = '#facc15';
              ctx.fillRect(p.x + p.w / 2 - 6, p.y - 6, 12, 6);
            }

            // Draw coin if present
            if (p.hasCoin) {
              ctx.fillStyle = '#facc15';
              ctx.beginPath();
              ctx.arc(p.x + p.w / 2, p.y - 14, 8, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ca8a04';
              ctx.beginPath();
              ctx.arc(p.x + p.w / 2, p.y - 14, 4, 0, Math.PI * 2);
              ctx.fill();

              // Check coin pickup
              if (Math.hypot(p.x + p.w / 2 - jumpPlayerX, p.y - 14 - jumpPlayerY) < 22) {
                p.hasCoin = false;
                localScore += 150 * settings.scoreMultiplier;
                setScore(localScore);
                sounds.playCoin();
                addExplosion(p.x + p.w / 2, p.y - 14, '#facc15', 10);
              }
            }
            ctx.restore();

            // Collision: only when falling downwards
            if (
              jumpVy > 0 &&
              jumpPlayerY + 16 >= p.y &&
              jumpPlayerY + 16 <= p.y + 16 &&
              jumpPlayerX >= p.x - 12 &&
              jumpPlayerX <= p.x + p.w + 12
            ) {
              if (p.type === 'spring') {
                jumpVy = -settings.jumpPower * 1.5;
                sounds.playJump();
                addExplosion(jumpPlayerX, jumpPlayerY + 16, '#10b981', 12);
              } else {
                jumpVy = -settings.jumpPower;
                sounds.playJump();
              }
            }

            // Remove platform if fell off screen bottom and respawn at top
            if (p.y > height + 40) {
              platforms.splice(i, 1);
              const topY = Math.min(...platforms.map((pl) => pl.y), 0) - (Math.random() * 60 + 70);
              const randType = Math.random();
              const type: 'normal' | 'moving' | 'spring' = randType > 0.8 ? 'spring' : randType > 0.5 ? 'moving' : 'normal';
              platforms.push({
                x: Math.random() * (width - 110) + 15,
                y: topY,
                w: Math.random() * 20 + 70,
                h: 14,
                type,
                vx: type === 'moving' ? (Math.random() > 0.5 ? 2 : -2) : 0,
                hasCoin: Math.random() > 0.6,
              });
            }
          }

          // Draw Player character
          ctx.save();
          ctx.translate(jumpPlayerX, jumpPlayerY);
          ctx.fillStyle = settings.playerColor || '#06b6d4';
          ctx.shadowColor = settings.playerColor || '#06b6d4';
          ctx.shadowBlur = 14;

          // Cute Astro Droid body
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();

          // Visor
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(-10, -6, 20, 10, 4);
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(-2, -1, 3, 0, Math.PI * 2);
          ctx.fill();

          // Legs / thrusters
          ctx.fillStyle = '#f97316';
          if (jumpVy < 0) {
            ctx.beginPath();
            ctx.moveTo(-6, 14);
            ctx.lineTo(0, 24);
            ctx.lineTo(6, 14);
            ctx.fill();
          }
          ctx.restore();

          // Fall off screen -> Game Over
          if (jumpPlayerY > height + 60) {
            sounds.playGameOver();
            triggerGameOver(localScore);
          }

        } else if (settings.genre === 'runner') {
          // --- NEON RUNNER LOGIC ---
          const floorY = height - 100;
          floorOffset = (floorOffset + settings.obstacleSpeed) % 40;

          // Jump mechanic
          if ((isUp || isAction) && isGrounded) {
            runnerVy = -settings.jumpPower;
            isGrounded = false;
            jumpCount = 1;
            sounds.playJump();
            addExplosion(runnerX, runnerY + 16, '#06b6d4', 8);
          } else if ((isUp || isAction) && jumpCount === 1 && runnerVy > -2) {
            // Double jump!
            runnerVy = -settings.jumpPower * 0.85;
            jumpCount = 2;
            sounds.playJump();
            addExplosion(runnerX, runnerY + 16, '#ec4899', 10);
          }

          // Gravity
          runnerVy += settings.gravity * 0.9;
          runnerY += runnerVy;

          // Ground check
          if (runnerY >= floorY) {
            runnerY = floorY;
            runnerVy = 0;
            isGrounded = true;
            jumpCount = 0;
          }

          // Draw Floor
          ctx.save();
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(0, floorY + 16, width, height - floorY);
          // Neon floor line
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(0, floorY + 16);
          ctx.lineTo(width, floorY + 16);
          ctx.stroke();

          // Grid lines on floor
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
          ctx.lineWidth = 1;
          for (let x = -floorOffset; x < width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, floorY + 16);
            ctx.lineTo(x - 20, height);
            ctx.stroke();
          }
          ctx.restore();

          // Obstacle spawner
          runnerObstacleTimer++;
          const runnerSpawnInterval = Math.max(45, 110 - settings.spawnRate * 14);
          if (runnerObstacleTimer > runnerSpawnInterval) {
            runnerObstacleTimer = 0;
            const rand = Math.random();
            if (rand < 0.5) {
              // Spike obstacle
              runnerObstacles.push({
                x: width + 30,
                y: floorY + 16,
                w: 26,
                h: 28,
                type: 'spike',
              });
            } else if (rand < 0.8) {
              // Floating Drone
              runnerObstacles.push({
                x: width + 30,
                y: floorY - 32,
                w: 28,
                h: 24,
                type: 'drone',
              });
            } else {
              // Collectible Data Chip
              runnerObstacles.push({
                x: width + 30,
                y: floorY - 45,
                w: 22,
                h: 22,
                type: 'chip',
              });
            }
          }

          // Obstacles update & collision
          for (let i = runnerObstacles.length - 1; i >= 0; i--) {
            const ob = runnerObstacles[i];
            ob.x -= settings.obstacleSpeed;

            // Draw obstacle
            ctx.save();
            if (ob.type === 'spike') {
              ctx.fillStyle = '#ef4444';
              ctx.shadowColor = '#ef4444';
              ctx.shadowBlur = 8;
              ctx.beginPath();
              ctx.moveTo(ob.x, ob.y);
              ctx.lineTo(ob.x + ob.w / 2, ob.y - ob.h);
              ctx.lineTo(ob.x + ob.w, ob.y);
              ctx.closePath();
              ctx.fill();
            } else if (ob.type === 'drone') {
              ctx.fillStyle = '#f59e0b';
              ctx.shadowColor = '#f59e0b';
              ctx.shadowBlur = 8;
              ctx.fillRect(ob.x, ob.y - ob.h, ob.w, ob.h);
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(ob.x + ob.w / 2, ob.y - ob.h / 2, 4, 0, Math.PI * 2);
              ctx.fill();
            } else if (ob.type === 'chip') {
              ctx.fillStyle = '#06b6d4';
              ctx.shadowColor = '#06b6d4';
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.arc(ob.x + ob.w / 2, ob.y - ob.h / 2, 9, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(ob.x + ob.w / 2 - 3, ob.y - ob.h / 2 - 3, 6, 6);
            }
            ctx.restore();

            // Collision check
            const box1 = { x: runnerX - 14, y: runnerY - 14, w: 28, h: 30 };
            const box2 = { x: ob.x, y: ob.y - ob.h, w: ob.w, h: ob.h };
            const isColliding =
              box1.x < box2.x + box2.w &&
              box1.x + box1.w > box2.x &&
              box1.y < box2.y + box2.h &&
              box1.y + box1.h > box2.y;

            if (isColliding) {
              if (ob.type === 'chip') {
                runnerObstacles.splice(i, 1);
                localScore += 200 * settings.scoreMultiplier;
                setScore(localScore);
                sounds.playCoin();
                addExplosion(box2.x, box2.y, '#06b6d4', 12);
              } else {
                // Hurt by spike or drone
                runnerObstacles.splice(i, 1);
                addExplosion(runnerX, runnerY, '#ef4444', 20);
                sounds.playExplosion();
                localLives--;
                setCurrentLives(localLives);
                if (localLives <= 0) {
                  triggerGameOver(localScore);
                }
              }
            } else if (ob.x < -40) {
              runnerObstacles.splice(i, 1);
              // Safe pass adds small score
              localScore += 10 * settings.scoreMultiplier;
              setScore(localScore);
            }
          }

          // Draw Runner player
          ctx.save();
          ctx.translate(runnerX, runnerY);
          ctx.fillStyle = settings.playerColor || '#ec4899';
          ctx.shadowColor = settings.playerColor || '#ec4899';
          ctx.shadowBlur = 12;

          // Cyber Ninja Runner
          ctx.beginPath();
          ctx.roundRect(-12, -18, 24, 32, 6);
          ctx.fill();

          // Scarf / trail
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(-10, -10);
          ctx.lineTo(-24 - Math.random() * 8, -6);
          ctx.lineTo(-10, -2);
          ctx.fill();

          // Visor eye
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(2, -12, 8, 4);
          ctx.restore();
        }
      }

      // Update & Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      // HUD / Top Bar inside Canvas
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, 0, width, 44);

      // Score
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`PTS: ${localScore}`, 14, 28);

      // Genre label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(settings.name.toUpperCase(), width / 2, 28);

      // Lives
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`♥ x ${localLives}`, width - 14, 28);
      ctx.restore();

      // Idle Screen (Before Start)
      if (gameState === 'idle') {
        ctx.save();
        ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
        ctx.fillRect(0, 44, width, height - 44);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(settings.name, width / 2, height / 2 - 60);

        ctx.fillStyle = '#a855f7';
        ctx.font = '14px monospace';
        ctx.fillText(`GÊNERO: ${settings.genre.toUpperCase()}`, width / 2, height / 2 - 30);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px sans-serif';
        ctx.fillText('Toque nos botões ou use Teclado / Touch', width / 2, height / 2 + 10);
        ctx.fillText('Clique no botão JOGAR abaixo para iniciar', width / 2, height / 2 + 35);

        if (highScore > 0) {
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 15px monospace';
          ctx.fillText(`★ RECORDE: ${highScore} PTS`, width / 2, height / 2 + 80);
        }
        ctx.restore();
      }

      // Game Over Screen
      if (gameState === 'gameover') {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(0, 44, width, height - 44);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FIM DE JOGO!', width / 2, height / 2 - 70);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px monospace';
        ctx.fillText(`${localScore}`, width / 2, height / 2 - 20);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.fillText('PONTUAÇÃO FINAL', width / 2, height / 2 + 15);

        if (localScore >= highScore && localScore > 0) {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText('🏆 NOVO RECORDE PESSOAL!', width / 2, height / 2 + 55);
        } else {
          ctx.fillStyle = '#facc15';
          ctx.font = '14px monospace';
          ctx.fillText(`Recorde Atual: ${highScore}`, width / 2, height / 2 + 55);
        }

        ctx.fillStyle = '#38bdf8';
        ctx.font = '13px sans-serif';
        ctx.fillText('Toque em "Jogar Novamente" para reiniciar', width / 2, height / 2 + 100);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    const triggerGameOver = (finalScore: number) => {
      if (gameOverHandled) return;
      gameOverHandled = true;
      setGameState('gameover');
      sounds.playGameOver();

      const prevBest = parseInt(localStorage.getItem(`gf_highscore_${settings.id}`) || '0', 10);
      if (finalScore > prevBest) {
        localStorage.setItem(`gf_highscore_${settings.id}`, finalScore.toString());
        setHighScore(finalScore);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      }

      if (onGameOver) {
        onGameOver(finalScore);
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, settings, highScore, onGameOver]);

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[440px] mx-auto">
      {/* Simulation Screen Wrapper */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-2xl border-2 border-slate-700/80 bg-slate-950 shadow-2xl ${
          isMobileSim ? 'ring-8 ring-slate-800 shadow-cyan-500/10' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          className="block w-full h-auto aspect-[420/640] max-h-[580px] touch-none object-contain"
        />

        {/* Quick Toolbar overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 backdrop-blur-sm transition-colors"
            title={soundMuted ? 'Ativar Som' : 'Mutar Som'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Primary Action Button (Start / Restart) */}
      <div className="w-full mt-3 flex items-center justify-center gap-3">
        {gameState === 'idle' ? (
          <button
            onClick={startGame}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" /> INICIAR JOGO
          </button>
        ) : gameState === 'gameover' ? (
          <button
            onClick={startGame}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" /> JOGAR NOVAMENTE
          </button>
        ) : (
          <button
            onClick={() => setGameState('idle')}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            Pausar
          </button>
        )}
      </div>

      {/* Mobile Virtual Touch Gamepad Controls */}
      <div className="w-full mt-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
          <span>Controles Virtuais para Celular (Touch):</span>
          <span className="text-[11px] text-slate-500 font-mono">Teclado: ← ↑ → / Espaço</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* D-Pad Left/Right/Up */}
          <div className="flex items-center gap-2">
            <button
              onPointerDown={(e) => { e.preventDefault(); touchInputRef.current.left = true; }}
              onPointerUp={(e) => { e.preventDefault(); touchInputRef.current.left = false; }}
              onPointerLeave={() => { touchInputRef.current.left = false; }}
              className="w-14 h-14 rounded-xl bg-slate-800 active:bg-cyan-500 active:text-slate-950 border border-slate-700 flex items-center justify-center text-xl font-bold text-slate-200 shadow-md select-none touch-none"
            >
              ◀
            </button>
            <button
              onPointerDown={(e) => { e.preventDefault(); touchInputRef.current.right = true; }}
              onPointerUp={(e) => { e.preventDefault(); touchInputRef.current.right = false; }}
              onPointerLeave={() => { touchInputRef.current.right = false; }}
              className="w-14 h-14 rounded-xl bg-slate-800 active:bg-cyan-500 active:text-slate-950 border border-slate-700 flex items-center justify-center text-xl font-bold text-slate-200 shadow-md select-none touch-none"
            >
              ▶
            </button>
          </div>

          {/* Action / Jump / Shoot Button */}
          <div className="flex items-center gap-2">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                touchInputRef.current.up = true;
                touchInputRef.current.action = true;
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                touchInputRef.current.up = false;
                touchInputRef.current.action = false;
              }}
              onPointerLeave={() => {
                touchInputRef.current.up = false;
                touchInputRef.current.action = false;
              }}
              className="h-14 px-6 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 active:from-rose-400 active:to-pink-400 text-white font-extrabold text-sm flex items-center justify-center gap-1 shadow-lg shadow-rose-500/20 select-none touch-none"
            >
              {settings.genre === 'space' ? '💥 DISPARAR' : '🚀 PULAR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
