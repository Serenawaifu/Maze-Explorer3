import { useEffect, useRef, useState, useMemo } from "react";
import { useGameState } from "./gameState";
import type { ActivePowerUp } from "./gameState";
import { THEME } from "./theme";
import { useAudioState, updateMasterVolume, playDamage } from "./audioSystem";
import type { PowerUpType } from "./mazeGenerator";
import { DIFFICULTY_CONFIG } from "./scoreSystem";
import { getThemeForLevel } from "./levelThemes";

const SEGMENTS = 20;

const POWERUP_INFO: Record<PowerUpType, { label: string; icon: string; color: string }> = {
  speed_boost: { label: "SPEED", icon: "⚡", color: "#3388ff" },
  shield: { label: "SHIELD", icon: "🛡️", color: "#00ddff" },
  health_potion: { label: "HEAL", icon: "💚", color: "#44dd55" },
  torch_upgrade: { label: "TORCH", icon: "🔦", color: "#ffcc00" },
};

function HealthBar({ health, maxHealth, invulnerable }: { health: number; maxHealth: number; invulnerable: boolean }) {
  const percent = (health / maxHealth) * 100;
  const filledSegments = Math.ceil((health / maxHealth) * SEGMENTS);
  const color = percent > 60 ? THEME.colors.health : percent > 30 ? THEME.colors.healthMid : THEME.colors.healthLow;

  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: 16,
            borderRadius: 1,
            background: i < filledSegments ? color : "rgba(255,255,255,0.06)",
            boxShadow: i < filledSegments ? `0 0 6px ${color}40` : "none",
            transition: "background 0.2s, box-shadow 0.2s",
            opacity: invulnerable ? (Math.floor(Date.now() / 100) % 2 === 0 ? 1 : 0.4) : 1,
          }}
        />
      ))}
    </div>
  );
}

function ActivePowerUps({ powerUps }: { powerUps: ActivePowerUp[] }) {
  if (powerUps.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      left: 14,
      top: "50%",
      transform: "translateY(-50%)",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      zIndex: 101,
    }}>
      {powerUps.map((pu) => {
        const info = POWERUP_INFO[pu.type];
        const pct = pu.remaining / pu.duration;
        return (
          <div
            key={pu.type}
            style={{
              background: THEME.colors.panel,
              borderRadius: 8,
              padding: "6px 10px",
              border: `1px solid ${info.color}44`,
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 110,
            }}
          >
            <span style={{ fontSize: 16 }}>{info.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 8,
                color: info.color,
                fontFamily: THEME.fonts.heading,
                letterSpacing: 1,
                marginBottom: 2,
              }}>{info.label}</div>
              <div style={{
                height: 3,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 2,
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${pct * 100}%`,
                  height: "100%",
                  background: info.color,
                  borderRadius: 2,
                  transition: "width 0.1s linear",
                  boxShadow: `0 0 4px ${info.color}`,
                }} />
              </div>
              <div style={{
                fontSize: 9,
                color: THEME.colors.textDim,
                fontFamily: THEME.fonts.mono,
                marginTop: 1,
              }}>
                {Math.ceil(pu.remaining)}s
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BossHealthBar() {
  const bossActive = useGameState((s) => s.bossActive);
  const bossHealth = useGameState((s) => s.bossHealth);
  const bossMaxHealth = useGameState((s) => s.bossMaxHealth);
  const bossPhase = useGameState((s) => s.bossPhase);
  const bossDefeated = useGameState((s) => s.bossDefeated);

  if (!bossActive || bossDefeated) return null;

  const percent = bossMaxHealth > 0 ? (bossHealth / bossMaxHealth) * 100 : 0;
  const barColor = bossPhase === 3 ? "#ff0044" : bossPhase === 2 ? "#ff6600" : "#cc00ff";
  const phaseLabel = bossPhase === 3 ? "ENRAGED" : bossPhase === 2 ? "FRENZIED" : "SHADOW LORD";

  return (
    <div style={{
      position: "fixed",
      bottom: 50,
      left: "50%",
      transform: "translateX(-50%)",
      width: 360,
      zIndex: 102,
      pointerEvents: "none",
    }}>
      <div style={{
        textAlign: "center",
        marginBottom: 4,
        fontFamily: THEME.fonts.heading,
        fontSize: 11,
        letterSpacing: 3,
        textTransform: "uppercase",
        color: barColor,
        textShadow: `0 0 12px ${barColor}60`,
      }}>
        {phaseLabel}
      </div>
      <div style={{
        height: 12,
        background: "rgba(0,0,0,0.7)",
        borderRadius: 6,
        overflow: "hidden",
        border: `1px solid ${barColor}44`,
        boxShadow: `0 0 8px ${barColor}30`,
      }}>
        <div style={{
          width: `${percent}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
          borderRadius: 5,
          transition: "width 0.15s ease-out",
          boxShadow: `0 0 10px ${barColor}80`,
        }} />
      </div>
      <div style={{
        textAlign: "center",
        marginTop: 2,
        fontFamily: THEME.fonts.mono,
        fontSize: 9,
        color: THEME.colors.textDim,
      }}>
        {Math.ceil(bossHealth)} / {bossMaxHealth}
      </div>
    </div>
  );
}

function AttackCooldownIndicator() {
  const bossActive = useGameState((s) => s.bossActive);
  const bossDefeated = useGameState((s) => s.bossDefeated);
  const attackCooldown = useGameState((s) => s.attackCooldown);

  if (!bossActive || bossDefeated) return null;

  const ready = attackCooldown <= 0;
  const cooldownPct = Math.min(1, attackCooldown / 1.5);

  return (
    <div style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, 20px)",
      pointerEvents: "none",
      zIndex: 101,
      textAlign: "center",
    }}>
      <div style={{
        width: 40,
        height: 4,
        background: "rgba(0,0,0,0.5)",
        borderRadius: 2,
        overflow: "hidden",
        margin: "0 auto",
      }}>
        <div style={{
          width: `${(1 - cooldownPct) * 100}%`,
          height: "100%",
          background: ready ? "#44aaff" : "#666",
          borderRadius: 2,
          transition: "width 0.05s linear",
          boxShadow: ready ? "0 0 6px #44aaff80" : "none",
        }} />
      </div>
      <div style={{
        fontSize: 8,
        fontFamily: THEME.fonts.mono,
        color: ready ? "#44aaff" : THEME.colors.textDim,
        marginTop: 2,
        letterSpacing: 1,
      }}>
        {ready ? "READY" : "COOLDOWN"}
      </div>
    </div>
  );
}

function VolumeControl() {
  const muted = useAudioState((s) => s.muted);
  const volume = useAudioState((s) => s.volume);
  const toggleMute = useAudioState((s) => s.toggleMute);
  const setVolume = useAudioState((s) => s.setVolume);

  const handleToggle = () => { toggleMute(); setTimeout(updateMasterVolume, 0); };
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
    setTimeout(updateMasterVolume, 0);
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 14,
      left: 14,
      zIndex: 101,
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: THEME.colors.panel,
      borderRadius: 8,
      padding: "6px 12px",
      border: `1px solid ${THEME.colors.panelBorder}`,
      backdropFilter: "blur(12px)",
      pointerEvents: "auto",
    }}>
      <button
        onClick={handleToggle}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 2,
          color: muted ? THEME.colors.danger : THEME.colors.primary,
          fontSize: 16,
          lineHeight: 1,
          fontFamily: "monospace",
        }}
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? "🔇" : volume > 0.5 ? "🔊" : "🔉"}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={muted ? 0 : volume}
        onChange={handleVolumeChange}
        style={{ width: 60, height: 4, accentColor: THEME.colors.primary, cursor: "pointer" }}
      />
    </div>
  );
}

export function HUD() {
  const score = useGameState((s) => s.score);
  const health = useGameState((s) => s.health);
  const maxHealth = useGameState((s) => s.maxHealth);
  const level = useGameState((s) => s.level);
  const timeRemaining = useGameState((s) => s.timeRemaining);
  const setTimeRemaining = useGameState((s) => s.setTimeRemaining);
  const collectiblesGathered = useGameState((s) => s.collectiblesGathered);
  const totalCollectibles = useGameState((s) => s.totalCollectibles);
  const screen = useGameState((s) => s.screen);
  const invulnerable = useGameState((s) => s.invulnerable);
  const activePowerUps = useGameState((s) => s.activePowerUps);
  const inFogZone = useGameState((s) => s.inFogZone);
  const difficulty = useGameState((s) => s.difficulty);
  const bossActive = useGameState((s) => s.bossActive);
  const bossDefeated = useGameState((s) => s.bossDefeated);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelTheme = useMemo(() => getThemeForLevel(level), [level]);
  const diffCfg = DIFFICULTY_CONFIG[difficulty];
  const [damageFlash, setDamageFlash] = useState(false);
  const prevHealthRef = useRef(health);

  useEffect(() => {
    if (health < prevHealthRef.current && screen === "playing") {
      setDamageFlash(true);
      playDamage();
      const t = setTimeout(() => setDamageFlash(false), 300);
      prevHealthRef.current = health;
      return () => { clearTimeout(t); };
    }
    prevHealthRef.current = health;
    return undefined;
  }, [health, screen]);

  useEffect(() => {
    if (screen !== "playing") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      const currentTime = useGameState.getState().timeRemaining;
      setTimeRemaining(currentTime - 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen, setTimeRemaining]);

  if (screen !== "playing") return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeWarning = timeRemaining <= 30;
  const healthPercent = (health / maxHealth) * 100;
  const lowHealth = healthPercent <= 30;

  const panelStyle: React.CSSProperties = {
    background: THEME.colors.panel,
    borderRadius: 8,
    padding: "8px 14px",
    backdropFilter: "blur(12px)",
    border: `1px solid ${THEME.colors.panelBorder}`,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    color: THEME.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontFamily: THEME.fonts.heading,
    marginBottom: 2,
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: THEME.fonts.heading,
    fontWeight: 700,
    color: THEME.colors.text,
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
      zIndex: 100,
      fontFamily: THEME.fonts.body,
    }}>
      {damageFlash && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(255,0,0,0.25) 100%)",
          pointerEvents: "none",
          animation: "fadeOut 0.3s ease-out forwards",
        }} />
      )}

      {lowHealth && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(180,0,0,0.2) 100%)",
          pointerEvents: "none",
          animation: "pulseVignette 2s ease-in-out infinite",
        }} />
      )}

      {inFogZone && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, rgba(80,100,120,0.15) 0%, rgba(40,50,60,0.4) 100%)",
          pointerEvents: "none",
        }} />
      )}

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "14px 20px",
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={panelStyle}>
            <div style={labelStyle}>Level</div>
            <div style={{ ...valueStyle, fontSize: 22, color: THEME.colors.primary }}>
              {level}
              <span style={{ fontSize: 11, color: THEME.colors.textDim, fontWeight: 400, marginLeft: 4 }}>/5</span>
            </div>
            <div style={{ fontSize: 8, fontFamily: THEME.fonts.heading, color: THEME.colors.textMuted, letterSpacing: 1, marginTop: 2 }}>
              {levelTheme.name}
            </div>
          </div>
          <div style={{ ...panelStyle, padding: "4px 10px" }}>
            <div style={{ fontSize: 8, fontFamily: THEME.fonts.heading, color: diffCfg.color, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
              {diffCfg.label}
            </div>
          </div>
          <div style={panelStyle}>
            <div style={labelStyle}>Score</div>
            <div style={{ ...valueStyle, fontSize: 20, color: THEME.colors.gold }}>
              {score.toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{
            ...panelStyle,
            borderColor: timeWarning ? "rgba(255,34,68,0.3)" : THEME.colors.panelBorder,
            textAlign: "center",
            minWidth: 100,
          }}>
            <div style={labelStyle}>Time</div>
            <div style={{
              ...valueStyle,
              fontSize: 26,
              fontVariantNumeric: "tabular-nums",
              color: timeWarning ? THEME.colors.danger : THEME.colors.text,
              textShadow: timeWarning ? THEME.glow.danger : "none",
            }}>
              {minutes}:{seconds.toString().padStart(2, "0")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div style={{ ...panelStyle, minWidth: 160 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={labelStyle}>Health</div>
              <div style={{
                fontSize: 11,
                fontFamily: THEME.fonts.heading,
                fontWeight: 600,
                color: healthPercent > 60 ? THEME.colors.health : healthPercent > 30 ? THEME.colors.healthMid : THEME.colors.healthLow,
              }}>
                {Math.round(healthPercent)}%
              </div>
            </div>
            <HealthBar health={health} maxHealth={maxHealth} invulnerable={invulnerable} />
          </div>
          <div style={panelStyle}>
            <div style={labelStyle}>Gems</div>
            <div style={{ ...valueStyle, fontSize: 18 }}>
              <span style={{ color: collectiblesGathered >= totalCollectibles ? THEME.colors.accent : THEME.colors.gold }}>
                {collectiblesGathered}
              </span>
              <span style={{ color: THEME.colors.textDim, fontWeight: 400, fontSize: 13, margin: "0 4px" }}>/</span>
              <span style={{ color: THEME.colors.textDim, fontWeight: 400, fontSize: 14 }}>{totalCollectibles}</span>
            </div>
          </div>
        </div>
      </div>

      <ActivePowerUps powerUps={activePowerUps} />

      <BossHealthBar />
      <AttackCooldownIndicator />

      <div style={{
        position: "fixed",
        bottom: 14,
        left: "50%",
        transform: "translateX(-50%)",
        fontFamily: THEME.fonts.body,
        fontSize: 12,
        fontWeight: 500,
        color: THEME.colors.textMuted,
        background: "rgba(5,8,16,0.7)",
        padding: "5px 16px",
        borderRadius: 6,
        border: `1px solid ${THEME.colors.panelBorder}`,
        letterSpacing: 0.5,
        backdropFilter: "blur(8px)",
      }}>
        {bossActive && !bossDefeated
          ? "WASD to move \u2022 Click to attack boss \u2022 Collect all gems \u2022 Defeat the boss"
          : "WASD to move \u2022 Mouse to look \u2022 Collect all gems \u2022 Reach the portal"}
      </div>

      <VolumeControl />

      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }}>
        <div style={{ width: 2, height: 20, background: "rgba(255,255,255,0.35)", position: "absolute", top: -10, left: -1, borderRadius: 1 }} />
        <div style={{ width: 20, height: 2, background: "rgba(255,255,255,0.35)", position: "absolute", top: -1, left: -10, borderRadius: 1 }} />
        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.5)", position: "absolute", top: -2, left: -2 }} />
      </div>

      <style>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes pulseVignette {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
