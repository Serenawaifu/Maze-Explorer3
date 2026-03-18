import { create } from "zustand";
import type { PowerUpType } from "./mazeGenerator";
import { type Difficulty, DIFFICULTY_CONFIG, saveScore, getRandomDifficulty } from "./scoreSystem";
import { loadMeta, addOranges, incrementRuns, getHealthBonus, getTimeBonusSeconds, getShieldDurationBonus, type MetaState } from "./metaProgression";
import { type LoreEntry, LORE_FRAGMENTS, markLoreDiscovered } from "./loreFragments";

export interface LevelConfig {
  level: number;
  mazeWidth: number;
  mazeHeight: number;
  collectibleCount: number;
  enemyCount: number;
  timeLimit: number;
  powerUpCount: number;
  trapCount: number;
  fogZoneCount: number;
}

const BASE_LEVELS: LevelConfig[] = [
  { level: 1, mazeWidth: 10, mazeHeight: 10, collectibleCount: 8, enemyCount: 3, timeLimit: 180, powerUpCount: 3, trapCount: 4, fogZoneCount: 2 },
  { level: 2, mazeWidth: 14, mazeHeight: 14, collectibleCount: 12, enemyCount: 5, timeLimit: 240, powerUpCount: 5, trapCount: 6, fogZoneCount: 3 },
  { level: 3, mazeWidth: 18, mazeHeight: 18, collectibleCount: 18, enemyCount: 8, timeLimit: 300, powerUpCount: 6, trapCount: 9, fogZoneCount: 4 },
  { level: 4, mazeWidth: 22, mazeHeight: 22, collectibleCount: 24, enemyCount: 12, timeLimit: 360, powerUpCount: 8, trapCount: 12, fogZoneCount: 5 },
  { level: 5, mazeWidth: 26, mazeHeight: 26, collectibleCount: 30, enemyCount: 15, timeLimit: 420, powerUpCount: 10, trapCount: 16, fogZoneCount: 7 },
];

function getBossStateForLevel(level: number) {
  const isBossLevel = level === 5;
  const bossMaxHp = isBossLevel ? 300 : 0;
  return {
    bossActive: isBossLevel,
    bossHealth: bossMaxHp,
    bossMaxHealth: bossMaxHp,
    bossPhase: 1 as 1 | 2 | 3,
    bossDefeated: false,
    bossStunTimer: 0,
    attackCooldown: 0,
    frameFreezeTimer: 0,
    collapseTimer: -1,
    bossPosition: { x: 0, z: 0 },
  };
}

function getAdjustedLevels(difficulty: Difficulty): LevelConfig[] {
  const cfg = DIFFICULTY_CONFIG[difficulty];
  return BASE_LEVELS.map((l) => ({
    ...l,
    enemyCount: Math.max(1, Math.round(l.enemyCount * cfg.enemyMultiplier)),
    timeLimit: Math.round(l.timeLimit * cfg.timeMultiplier),
  }));
}

export type GameScreen = "start" | "playing" | "paused" | "levelComplete" | "gameOver" | "victory" | "leaderboard" | "shop";

export interface ActivePowerUp {
  type: PowerUpType;
  remaining: number;
  duration: number;
}

interface GameState {
  screen: GameScreen;
  level: number;
  score: number;
  health: number;
  maxHealth: number;
  timeRemaining: number;
  collectiblesGathered: number;
  totalCollectibles: number;
  playerPosition: { x: number; z: number };
  playerYaw: number;
  invulnerable: boolean;
  runId: number;
  activePowerUps: ActivePowerUp[];
  screenShake: number;
  inFogZone: boolean;
  difficulty: Difficulty;
  lastScoreRank: number;
  lastScoreIsNewBest: boolean;

  bossActive: boolean;
  bossHealth: number;
  bossMaxHealth: number;
  bossPhase: 1 | 2 | 3;
  bossDefeated: boolean;
  bossStunTimer: number;
  attackCooldown: number;
  frameFreezeTimer: number;
  collapseTimer: number;
  bossPosition: { x: number; z: number };

  orangesEarned: number;
  meta: MetaState;

  activeLoreEntry: LoreEntry | null;
  loreCollectedThisRun: number;

  setScreen: (screen: GameScreen) => void;
  startGame: () => void;
  nextLevel: () => void;
  addScore: (points: number) => void;
  takeDamage: (amount: number) => void;
  setTimeRemaining: (time: number) => void;
  collectItem: () => void;
  setPlayerPosition: (x: number, z: number) => void;
  setPlayerYaw: (yaw: number) => void;
  setTotalCollectibles: (count: number) => void;
  getLevelConfig: () => LevelConfig;
  setInvulnerable: (val: boolean) => void;
  resetForLevel: (level: number) => void;
  addPowerUp: (type: PowerUpType) => void;
  tickPowerUps: (delta: number) => void;
  hasPowerUp: (type: PowerUpType) => boolean;
  triggerScreenShake: (intensity: number) => void;
  setInFogZone: (val: boolean) => void;
  healPlayer: (amount: number) => void;
  showLeaderboard: () => void;
  showShop: () => void;
  backToStart: () => void;
  damageBoss: (amount: number) => void;
  playerAttack: () => boolean;
  tickBossTimers: (delta: number) => void;
  setBossPosition: (x: number, z: number) => void;
  startCollapse: () => void;
  refreshMeta: () => void;
  collectLore: (loreId: string) => void;
  dismissLore: () => void;
}

const POWERUP_DURATIONS: Record<PowerUpType, number> = {
  speed_boost: 10,
  shield: 15,
  health_potion: 0,
  torch_upgrade: 20,
};

function endRunAndSaveScore(state: GameState): { lastScoreRank: number; lastScoreIsNewBest: boolean } {
  const finalScore = Math.round(state.score * DIFFICULTY_CONFIG[state.difficulty].scoreMultiplier);
  const result = saveScore({
    score: finalScore,
    level: state.level,
    difficulty: state.difficulty,
    date: new Date().toISOString(),
  });
  return { lastScoreRank: result.rank, lastScoreIsNewBest: result.isNewBest };
}

export const useGameState = create<GameState>((set, get) => ({
  screen: "start",
  level: 1,
  score: 0,
  health: 100,
  maxHealth: 100,
  timeRemaining: 120,
  collectiblesGathered: 0,
  totalCollectibles: 0,
  playerPosition: { x: 0, z: 0 },
  playerYaw: 0,
  invulnerable: false,
  runId: 0,
  activePowerUps: [],
  screenShake: 0,
  inFogZone: false,
  difficulty: "normal",
  lastScoreRank: 0,
  lastScoreIsNewBest: false,

  bossActive: false,
  bossHealth: 0,
  bossMaxHealth: 0,
  bossPhase: 1,
  bossDefeated: false,
  bossStunTimer: 0,
  attackCooldown: 0,
  frameFreezeTimer: 0,
  collapseTimer: -1,
  bossPosition: { x: 0, z: 0 },

  orangesEarned: 0,
  meta: loadMeta(),

  activeLoreEntry: null,
  loreCollectedThisRun: 0,

  setScreen: (screen) => set({ screen }),

  startGame: () => {
    const diff = getRandomDifficulty();
    const levels = getAdjustedLevels(diff);
    const config = levels[0];
    let meta = loadMeta();
    meta = incrementRuns(meta);
    const healthBonus = getHealthBonus(meta);
    const timeBonus = getTimeBonusSeconds(meta);
    const baseHealth = Math.round((100 + healthBonus) * DIFFICULTY_CONFIG[diff].healthMultiplier);
    set((s) => ({
      screen: "playing",
      level: 1,
      score: 0,
      health: baseHealth,
      maxHealth: baseHealth,
      timeRemaining: config.timeLimit + timeBonus,
      collectiblesGathered: 0,
      totalCollectibles: config.collectibleCount,
      playerPosition: { x: 0, z: 0 },
      playerYaw: 0,
      invulnerable: false,
      runId: s.runId + 1,
      activePowerUps: [],
      screenShake: 0,
      inFogZone: false,
      difficulty: diff,
      lastScoreRank: 0,
      lastScoreIsNewBest: false,
      orangesEarned: 0,
      meta,
      activeLoreEntry: null,
      loreCollectedThisRun: 0,
      ...getBossStateForLevel(1),
    }));
  },

  nextLevel: () => {
    const state = get();
    const currentLevel = state.level;
    const nextLevelNum = currentLevel + 1;
    const nextDiff = getRandomDifficulty();
    const levels = getAdjustedLevels(nextDiff);
    if (nextLevelNum > levels.length) {
      const saveResult = endRunAndSaveScore(state);
      const updatedMeta = addOranges(state.meta, state.orangesEarned);
      set({ screen: "victory", ...saveResult, meta: updatedMeta });
      return;
    }
    const config = levels[nextLevelNum - 1];
    const timeBonus = getTimeBonusSeconds(state.meta);
    const healthBonus = getHealthBonus(state.meta);
    const baseHealth = Math.round((100 + healthBonus) * DIFFICULTY_CONFIG[nextDiff].healthMultiplier);
    set({
      screen: "playing",
      level: nextLevelNum,
      difficulty: nextDiff,
      health: baseHealth,
      maxHealth: baseHealth,
      timeRemaining: config.timeLimit + timeBonus,
      collectiblesGathered: 0,
      totalCollectibles: config.collectibleCount,
      playerPosition: { x: 0, z: 0 },
      playerYaw: 0,
      invulnerable: false,
      activePowerUps: [],
      screenShake: 0,
      inFogZone: false,
      ...getBossStateForLevel(nextLevelNum),
    });
  },

  addScore: (points) => set((s) => ({ score: s.score + points })),

  takeDamage: (amount) => {
    const state = get();
    if (state.invulnerable) return;
    if (state.hasPowerUp("shield")) {
      const reduced = Math.floor(amount * 0.3);
      const newHealth = Math.max(0, state.health - reduced);
      if (newHealth <= 0) {
        const saveResult = endRunAndSaveScore({ ...state, health: 0 });
        const updatedMeta = addOranges(state.meta, state.orangesEarned);
        set({ health: 0, screen: "gameOver", screenShake: 0.8, ...saveResult, meta: updatedMeta });
      } else {
        set({ health: newHealth, invulnerable: true, screenShake: 0.4 });
        setTimeout(() => { get().setInvulnerable(false); }, 1000);
      }
      return;
    }
    const newHealth = Math.max(0, state.health - amount);
    if (newHealth <= 0) {
      const saveResult = endRunAndSaveScore({ ...state, health: 0 });
      const updatedMeta = addOranges(state.meta, state.orangesEarned);
      set({ health: 0, screen: "gameOver", screenShake: 1.0, ...saveResult, meta: updatedMeta });
    } else {
      set({ health: newHealth, invulnerable: true, screenShake: 0.8 });
      setTimeout(() => {
        get().setInvulnerable(false);
      }, 1500);
    }
  },

  setTimeRemaining: (time) => {
    if (time <= 0) {
      const state = get();
      const saveResult = endRunAndSaveScore({ ...state, timeRemaining: 0 });
      const updatedMeta = addOranges(state.meta, state.orangesEarned);
      set({ timeRemaining: 0, screen: "gameOver", ...saveResult, meta: updatedMeta });
    } else {
      set({ timeRemaining: time });
    }
  },

  collectItem: () => {
    const state = get();
    const newGathered = state.collectiblesGathered + 1;
    set({ collectiblesGathered: newGathered, orangesEarned: state.orangesEarned + 1 });
  },

  setPlayerPosition: (x, z) => set({ playerPosition: { x, z } }),
  setPlayerYaw: (yaw) => set({ playerYaw: yaw }),
  setTotalCollectibles: (count) => set({ totalCollectibles: count }),
  getLevelConfig: () => {
    const state = get();
    const levels = getAdjustedLevels(state.difficulty);
    return levels[Math.min(state.level - 1, levels.length - 1)];
  },
  setInvulnerable: (val) => set({ invulnerable: val }),

  resetForLevel: (level) => {
    const state = get();
    const levels = getAdjustedLevels(state.difficulty);
    const config = levels[Math.min(level - 1, levels.length - 1)];
    set({
      level,
      health: state.maxHealth,
      timeRemaining: config.timeLimit,
      collectiblesGathered: 0,
      totalCollectibles: config.collectibleCount,
      playerPosition: { x: 0, z: 0 },
      invulnerable: false,
      activePowerUps: [],
      screenShake: 0,
      inFogZone: false,
      ...getBossStateForLevel(level),
    });
  },

  addPowerUp: (type) => {
    if (type === "health_potion") {
      get().healPlayer(40);
      return;
    }
    let duration = POWERUP_DURATIONS[type];
    if (type === "shield") {
      duration += getShieldDurationBonus(get().meta);
    }
    set((s) => {
      const existing = s.activePowerUps.findIndex((p) => p.type === type);
      if (existing >= 0) {
        const updated = [...s.activePowerUps];
        updated[existing] = { type, remaining: duration, duration };
        return { activePowerUps: updated };
      }
      return { activePowerUps: [...s.activePowerUps, { type, remaining: duration, duration }] };
    });
  },

  tickPowerUps: (delta) => {
    set((s) => {
      const updated = s.activePowerUps
        .map((p) => ({ ...p, remaining: p.remaining - delta }))
        .filter((p) => p.remaining > 0);
      const shake = Math.max(0, s.screenShake - delta * 3);
      return { activePowerUps: updated, screenShake: shake };
    });
  },

  hasPowerUp: (type) => get().activePowerUps.some((p) => p.type === type),

  triggerScreenShake: (intensity) => set({ screenShake: intensity }),

  setInFogZone: (val) => set({ inFogZone: val }),

  healPlayer: (amount) => {
    set((s) => ({ health: Math.min(s.maxHealth, s.health + amount) }));
  },


  showLeaderboard: () => set({ screen: "leaderboard" }),

  showShop: () => set({ screen: "shop", meta: loadMeta() }),

  backToStart: () => set({ screen: "start", meta: loadMeta() }),

  refreshMeta: () => set({ meta: loadMeta() }),

  collectLore: (loreId) => {
    const entry = LORE_FRAGMENTS.find((l) => l.id === loreId);
    if (!entry) return;
    markLoreDiscovered(loreId);
    set((s) => ({
      activeLoreEntry: entry,
      loreCollectedThisRun: s.loreCollectedThisRun + 1,
      score: s.score + 50,
    }));
  },

  dismissLore: () => set({ activeLoreEntry: null }),

  damageBoss: (amount) => {
    const state = get();
    if (!state.bossActive || state.bossDefeated) return;
    const newHp = Math.max(0, state.bossHealth - amount);
    let newPhase: 1 | 2 | 3 = state.bossPhase;
    const pct = newHp / state.bossMaxHealth;
    if (pct <= 0.25) newPhase = 3;
    else if (pct <= 0.5) newPhase = 2;
    else newPhase = 1;

    if (newHp <= 0) {
      set({
        bossHealth: 0,
        bossDefeated: true,
        bossPhase: 3,
        frameFreezeTimer: 0.25,
        screenShake: 1.5,
      });
    } else {
      set({
        bossHealth: newHp,
        bossPhase: newPhase,
        frameFreezeTimer: 0.08,
        screenShake: 0.6,
      });
    }
  },

  playerAttack: () => {
    const state = get();
    if (state.attackCooldown > 0) return false;
    set({ attackCooldown: 1.5 });
    return true;
  },

  tickBossTimers: (delta) => {
    set((s) => {
      const updates: Partial<GameState> = {};
      if (s.attackCooldown > 0) updates.attackCooldown = Math.max(0, s.attackCooldown - delta);
      if (s.bossStunTimer > 0) updates.bossStunTimer = Math.max(0, s.bossStunTimer - delta);
      if (s.frameFreezeTimer > 0) updates.frameFreezeTimer = Math.max(0, s.frameFreezeTimer - delta);
      if (s.collapseTimer > 0) {
        updates.collapseTimer = s.collapseTimer - delta;
        if (updates.collapseTimer <= 0) {
          updates.collapseTimer = 0;
        }
      }
      return updates;
    });
  },

  setBossPosition: (x, z) => set({ bossPosition: { x, z } }),

  startCollapse: () => {
    set({ collapseTimer: 4.0, screenShake: 2.0 });
  },
}));
