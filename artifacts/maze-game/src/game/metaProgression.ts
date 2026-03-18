const STORAGE_KEY = "maze_runner_meta";

export type UpgradeId = "max_health" | "move_speed" | "flashlight" | "attack_power" | "time_bonus" | "shield_duration";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  icon: string;
  baseCost: number;
  maxLevel: number;
  perLevel: string;
  color: string;
}

export const UPGRADES: UpgradeDef[] = [
  { id: "max_health", name: "Vitality", description: "Increase maximum health", icon: "❤️", baseCost: 5, maxLevel: 10, perLevel: "+10 HP", color: "#44cc88" },
  { id: "move_speed", name: "Swiftness", description: "Increase movement speed", icon: "⚡", baseCost: 8, maxLevel: 8, perLevel: "+5% speed", color: "#3388ff" },
  { id: "flashlight", name: "Luminary", description: "Extend flashlight range", icon: "🔦", baseCost: 6, maxLevel: 8, perLevel: "+10% range", color: "#ffcc00" },
  { id: "attack_power", name: "Might", description: "Increase attack damage", icon: "⚔️", baseCost: 10, maxLevel: 8, perLevel: "+5 damage", color: "#ff4466" },
  { id: "time_bonus", name: "Chrono", description: "Extra starting time", icon: "⏳", baseCost: 7, maxLevel: 10, perLevel: "+15 seconds", color: "#aa88ff" },
  { id: "shield_duration", name: "Aegis", description: "Extend shield power-up duration", icon: "🛡️", baseCost: 8, maxLevel: 6, perLevel: "+3 seconds", color: "#00ddff" },
];

export interface MetaState {
  oranges: number;
  upgradeLevels: Record<UpgradeId, number>;
  totalOrangesEarned: number;
  totalRuns: number;
}

function defaultState(): MetaState {
  return {
    oranges: 0,
    upgradeLevels: {
      max_health: 0,
      move_speed: 0,
      flashlight: 0,
      attack_power: 0,
      time_bonus: 0,
      shield_duration: 0,
    },
    totalOrangesEarned: 0,
    totalRuns: 0,
  };
}

export function loadMeta(): MetaState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const def = defaultState();
    return {
      oranges: typeof parsed.oranges === "number" ? parsed.oranges : 0,
      upgradeLevels: { ...def.upgradeLevels, ...(parsed.upgradeLevels || {}) },
      totalOrangesEarned: typeof parsed.totalOrangesEarned === "number" ? parsed.totalOrangesEarned : 0,
      totalRuns: typeof parsed.totalRuns === "number" ? parsed.totalRuns : 0,
    };
  } catch {
    return defaultState();
  }
}

export function saveMeta(state: MetaState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function getUpgradeCost(upgrade: UpgradeDef, currentLevel: number): number {
  return Math.floor(upgrade.baseCost * Math.pow(1.15, currentLevel));
}

export function purchaseUpgrade(meta: MetaState, upgradeId: UpgradeId): MetaState | null {
  const upgrade = UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade) return null;
  const currentLevel = meta.upgradeLevels[upgradeId];
  if (currentLevel >= upgrade.maxLevel) return null;
  const cost = getUpgradeCost(upgrade, currentLevel);
  if (meta.oranges < cost) return null;
  const newState: MetaState = {
    ...meta,
    oranges: meta.oranges - cost,
    upgradeLevels: { ...meta.upgradeLevels, [upgradeId]: currentLevel + 1 },
  };
  saveMeta(newState);
  return newState;
}

export function addOranges(meta: MetaState, amount: number): MetaState {
  const newState: MetaState = {
    ...meta,
    oranges: meta.oranges + amount,
    totalOrangesEarned: meta.totalOrangesEarned + amount,
  };
  saveMeta(newState);
  return newState;
}

export function incrementRuns(meta: MetaState): MetaState {
  const newState = { ...meta, totalRuns: meta.totalRuns + 1 };
  saveMeta(newState);
  return newState;
}

export function getHealthBonus(meta: MetaState): number {
  return meta.upgradeLevels.max_health * 10;
}

export function getSpeedMultiplier(meta: MetaState): number {
  return 1 + meta.upgradeLevels.move_speed * 0.05;
}

export function getFlashlightMultiplier(meta: MetaState): number {
  return 1 + meta.upgradeLevels.flashlight * 0.10;
}

export function getAttackDamageBonus(meta: MetaState): number {
  return meta.upgradeLevels.attack_power * 5;
}

export function getTimeBonusSeconds(meta: MetaState): number {
  return meta.upgradeLevels.time_bonus * 15;
}

export function getShieldDurationBonus(meta: MetaState): number {
  return meta.upgradeLevels.shield_duration * 3;
}

export function resetMeta(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
