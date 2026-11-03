export type GameGenre = 'space' | 'jump' | 'runner';

export interface GameSettings {
  id: string;
  name: string;
  genre: GameGenre;
  theme: 'cyberpunk' | 'retro-space' | 'neon-arcade' | 'pixel-adventure';
  playerSpeed: number; // 3 to 12
  gravity: number; // 0.2 to 1.5
  jumpPower: number; // 8 to 22
  obstacleSpeed: number; // 2 to 10
  spawnRate: number; // 1 to 5 (difficulty)
  playerColor: string;
  playerSprite: 'ship' | 'droid' | 'hero' | 'saucer';
  lives: number; // 1 to 5
  soundEnabled: boolean;
  scoreMultiplier: number;
}

export interface ApkBuildConfig {
  appName: string;
  packageName: string; // e.g. com.gameforge.meujogo
  versionName: string;
  versionCode: number;
  orientation: 'portrait' | 'landscape' | 'sensor';
  targetSdk: number; // 34
  minSdk: number; // 24
  fullscreen: boolean;
  buildTool: 'pwabuilder' | 'capacitor' | 'cordova';
}

export interface HighScore {
  gameId: string;
  score: number;
  date: string;
}
