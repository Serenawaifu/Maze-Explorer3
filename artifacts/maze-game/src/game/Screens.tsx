import { useEffect, useState, useRef } from "react";
import { useGameState } from "./gameState";
import { THEME } from "./theme";
import { type Difficulty, DIFFICULTY_CONFIG, getLeaderboard } from "./scoreSystem";
import { getThemeForLevel } from "./levelThemes";
import { UPGRADES, getUpgradeCost, purchaseUpgrade, loadMeta, type UpgradeId } from "./metaProgression";
import { LoreJournal } from "./LoreOverlay";

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const orangeImg = new Image();
    orangeImg.src = import.meta.env.BASE_URL + "orange.png";
    let imgLoaded = false;
    orangeImg.onload = () => { imgLoaded = true; };

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; rotation: number; rotSpeed: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.4 - 0.1,
        size: 16 + Math.random() * 24,
        alpha: Math.random() * 0.5 + 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      });
    }

    const animate = () => {
      ctx.fillStyle = "rgba(14,8,4,0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.y < -p.size * 2) {
          p.y = canvas.height + p.size * 2;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -p.size * 2) p.x = canvas.width + p.size * 2;
        if (p.x > canvas.width + p.size * 2) p.x = -p.size * 2;

        const flickerAlpha = p.alpha * (0.6 + Math.sin(Date.now() * 0.001 + p.x) * 0.4);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = flickerAlpha;

        if (imgLoaded) {
          ctx.drawImage(orangeImg, -p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.fillStyle = "#ff8c00";
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, zIndex: 0 }}
    />
  );
}

function ScanlineOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 3px)",
        pointerEvents: "none",
      }}
    />
  );
}

function FadeInItem({ children, delay, style }: { children: React.ReactNode; delay: number; style?: React.CSSProperties }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const overlayBase: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 200,
  fontFamily: THEME.fonts.body,
  color: THEME.colors.text,
};

function GameButton({ onClick, color, glowColor, children, small }: { onClick: () => void; color: string; glowColor: string; children: React.ReactNode; small?: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        padding: small ? "10px 28px" : "14px 48px",
        fontSize: small ? 11 : 14,
        fontWeight: 700,
        fontFamily: THEME.fonts.heading,
        border: "1px solid " + (hovered ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"),
        borderRadius: 6,
        cursor: "pointer",
        textTransform: "uppercase",
        letterSpacing: 3,
        background: hovered ? color : "rgba(255,255,255,0.03)",
        color: hovered ? "#fff" : THEME.colors.text,
        boxShadow: hovered ? `0 0 30px ${glowColor}, 0 0 60px ${glowColor}40` : `0 4px 20px rgba(0,0,0,0.3)`,
        transform: hovered ? "scale(1.03)" : "scale(1)",
        transition: "all 0.3s ease",
        backdropFilter: "blur(8px)",
      }}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, color, delay }: { label: string; value: string | number; color: string; delay: number }) {
  return (
    <FadeInItem delay={delay}>
      <div style={{
        background: THEME.colors.panel,
        border: `1px solid ${THEME.colors.panelBorder}`,
        borderRadius: 8,
        padding: "16px 28px",
        textAlign: "center",
        minWidth: 100,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          fontSize: 10,
          fontFamily: THEME.fonts.heading,
          color: THEME.colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 2,
          marginBottom: 6,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 32,
          fontFamily: THEME.fonts.heading,
          fontWeight: 800,
          color,
        }}>
          {value}
        </div>
      </div>
    </FadeInItem>
  );
}

function NewBestBadge() {
  return (
    <div style={{
      display: "inline-block",
      padding: "6px 18px",
      borderRadius: 20,
      background: "linear-gradient(135deg, rgba(255,200,0,0.2), rgba(255,140,0,0.2))",
      border: "1px solid rgba(255,200,0,0.4)",
      marginBottom: 16,
    }}>
      <span style={{
        fontSize: 12,
        fontFamily: THEME.fonts.heading,
        fontWeight: 700,
        color: THEME.colors.gold,
        letterSpacing: 3,
        textTransform: "uppercase",
        textShadow: THEME.glow.gold,
      }}>
        NEW PERSONAL BEST
      </span>
    </div>
  );
}

export function StartScreen() {
  const screen = useGameState((s) => s.screen);
  const startGame = useGameState((s) => s.startGame);
  const showLeaderboard = useGameState((s) => s.showLeaderboard);
  const showShop = useGameState((s) => s.showShop);
  const meta = useGameState((s) => s.meta);
  const [showJournal, setShowJournal] = useState(false);

  if (screen !== "start") return null;
  if (showJournal) return <LoreJournal onClose={() => setShowJournal(false)} />;

  const controls = [
    { key: "WASD / Arrows", desc: "Move through the maze", color: THEME.colors.primary },
    { key: "Mouse", desc: "Look around", color: THEME.colors.primary },
    { key: "Oranges", desc: "Collect for points", color: THEME.colors.gold },
    { key: "Enemies", desc: "Avoid — they deal damage", color: THEME.colors.danger },
    { key: "Portal", desc: "Escape after collecting all oranges", color: THEME.colors.accent },
  ];

  return (
    <div style={{ ...overlayBase, background: THEME.colors.bgDark }}>
      <ParticleBackground />
      <ScanlineOverlay />

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 520 }}>
        <FadeInItem delay={100}>
          <div style={{
            fontSize: 11,
            fontFamily: THEME.fonts.heading,
            color: THEME.colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: 6,
            marginBottom: 12,
          }}>
            A 3D Dungeon Experience
          </div>
        </FadeInItem>

        <FadeInItem delay={300}>
          <h1
            style={{
              fontSize: 56,
              fontWeight: 900,
              margin: 0,
              fontFamily: THEME.fonts.heading,
              background: `linear-gradient(135deg, ${THEME.colors.primary}, ${THEME.colors.gold})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: 4,
              lineHeight: 1.1,
            }}
          >
            MAZE
            <br />
            RUNNER
          </h1>
        </FadeInItem>

        <FadeInItem delay={500}>
          <div style={{
            width: 60,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${THEME.colors.primary}, transparent)`,
            margin: "20px auto",
          }} />
        </FadeInItem>

        <FadeInItem delay={600}>
          <p style={{
            fontSize: 15,
            color: THEME.colors.textDim,
            fontWeight: 400,
            marginBottom: 20,
            lineHeight: 1.6,
          }}>
            Navigate procedurally generated dungeons. Collect oranges.
            <br />Avoid patrolling enemies. Find the portal to escape.
          </p>
        </FadeInItem>

        <FadeInItem delay={700}>
          <div
            style={{
              background: THEME.colors.panel,
              borderRadius: 8,
              padding: "20px 24px",
              marginBottom: 24,
              border: `1px solid ${THEME.colors.panelBorder}`,
              textAlign: "left",
              backdropFilter: "blur(12px)",
            }}
          >
            <div style={{
              fontSize: 9,
              fontFamily: THEME.fonts.heading,
              color: THEME.colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: 3,
              marginBottom: 14,
            }}>
              Controls
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {controls.map((ctrl, i) => (
                <FadeInItem key={ctrl.key} delay={900 + i * 80}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{
                      color: ctrl.color,
                      fontSize: 12,
                      fontFamily: THEME.fonts.heading,
                      fontWeight: 600,
                      minWidth: 110,
                      letterSpacing: 1,
                    }}>
                      {ctrl.key}
                    </span>
                    <span style={{ color: THEME.colors.textDim, fontSize: 13, fontWeight: 400 }}>
                      {ctrl.desc}
                    </span>
                  </div>
                </FadeInItem>
              ))}
            </div>
          </div>
        </FadeInItem>

        <FadeInItem delay={1400}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <GameButton onClick={startGame} color={THEME.colors.primary} glowColor={THEME.colors.primaryGlow}>
              Enter the Maze
            </GameButton>
            <GameButton onClick={showShop} color="rgba(255,140,0,0.25)" glowColor="#ff8c0060" small>
              Shop ({meta.oranges} 🍊)
            </GameButton>
            <GameButton onClick={() => setShowJournal(true)} color="rgba(255,215,0,0.15)" glowColor="#ffd70060" small>
              Lore Journal
            </GameButton>
            <GameButton onClick={showLeaderboard} color="rgba(255,165,0,0.2)" glowColor={THEME.colors.goldGlow} small>
              Leaderboard
            </GameButton>
          </div>
        </FadeInItem>

        <FadeInItem delay={1600}>
          <div style={{
            fontSize: 11,
            color: THEME.colors.textMuted,
            marginTop: 20,
            fontFamily: THEME.fonts.heading,
            letterSpacing: 1,
          }}>
            5 Levels &bull; Random Difficulty &bull; Procedural Generation
          </div>
        </FadeInItem>
      </div>
    </div>
  );
}

export function LeaderboardScreen() {
  const screen = useGameState((s) => s.screen);
  const backToStart = useGameState((s) => s.backToStart);

  if (screen !== "leaderboard") return null;

  const entries = getLeaderboard();

  const diffColors: Record<string, string> = {
    easy: DIFFICULTY_CONFIG.easy.color,
    normal: DIFFICULTY_CONFIG.normal.color,
    hard: DIFFICULTY_CONFIG.hard.color,
    nightmare: DIFFICULTY_CONFIG.nightmare.color,
  };

  return (
    <div style={{ ...overlayBase, background: THEME.colors.bgDark }}>
      <ParticleBackground />
      <ScanlineOverlay />

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 520, width: "100%" }}>
        <FadeInItem delay={100}>
          <div style={{
            fontSize: 10,
            fontFamily: THEME.fonts.heading,
            color: THEME.colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: 6,
            marginBottom: 8,
          }}>
            Hall of Fame
          </div>
        </FadeInItem>

        <FadeInItem delay={200}>
          <h1 style={{
            fontSize: 42,
            fontWeight: 900,
            fontFamily: THEME.fonts.heading,
            margin: 0,
            marginBottom: 8,
            background: `linear-gradient(135deg, ${THEME.colors.gold}, ${THEME.colors.primary})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: 4,
          }}>
            LEADERBOARD
          </h1>
        </FadeInItem>

        <FadeInItem delay={300}>
          <div style={{
            width: 80,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${THEME.colors.gold}, transparent)`,
            margin: "12px auto 24px",
          }} />
        </FadeInItem>

        <FadeInItem delay={400}>
          <div style={{
            background: THEME.colors.panel,
            borderRadius: 8,
            border: `1px solid ${THEME.colors.panelBorder}`,
            backdropFilter: "blur(12px)",
            padding: "16px 20px",
            marginBottom: 28,
            maxHeight: 380,
            overflowY: "auto",
          }}>
            {entries.length === 0 ? (
              <div style={{
                color: THEME.colors.textDim,
                fontSize: 14,
                padding: "20px 0",
                fontFamily: THEME.fonts.body,
              }}>
                No scores yet. Play a game to set your first record!
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["#", "Score", "Level", "Difficulty", "Date"].map((h) => (
                      <th key={h} style={{
                        fontSize: 8,
                        fontFamily: THEME.fonts.heading,
                        color: THEME.colors.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: 2,
                        padding: "6px 8px",
                        borderBottom: `1px solid ${THEME.colors.panelBorder}`,
                        textAlign: h === "Score" ? "right" : "center",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr key={i} style={{
                      borderBottom: i < entries.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none",
                    }}>
                      <td style={{
                        padding: "8px",
                        textAlign: "center",
                        fontSize: 14,
                        fontFamily: THEME.fonts.heading,
                        fontWeight: 700,
                        color: i === 0 ? THEME.colors.gold : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : THEME.colors.textDim,
                      }}>
                        {i + 1}
                      </td>
                      <td style={{
                        padding: "8px",
                        textAlign: "right",
                        fontSize: 16,
                        fontFamily: THEME.fonts.heading,
                        fontWeight: 700,
                        color: THEME.colors.gold,
                      }}>
                        {entry.score.toLocaleString()}
                      </td>
                      <td style={{
                        padding: "8px",
                        textAlign: "center",
                        fontSize: 13,
                        fontFamily: THEME.fonts.heading,
                        color: THEME.colors.text,
                      }}>
                        {entry.level}/5
                      </td>
                      <td style={{
                        padding: "8px",
                        textAlign: "center",
                        fontSize: 9,
                        fontFamily: THEME.fonts.heading,
                        fontWeight: 600,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                        color: diffColors[entry.difficulty] || THEME.colors.textDim,
                      }}>
                        {entry.difficulty}
                      </td>
                      <td style={{
                        padding: "8px",
                        textAlign: "center",
                        fontSize: 10,
                        fontFamily: THEME.fonts.mono,
                        color: THEME.colors.textMuted,
                      }}>
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </FadeInItem>

        <FadeInItem delay={500}>
          <GameButton onClick={backToStart} color="rgba(255,165,0,0.2)" glowColor={THEME.colors.goldGlow}>
            Back
          </GameButton>
        </FadeInItem>
      </div>
    </div>
  );
}

export function GameOverScreen() {
  const screen = useGameState((s) => s.screen);
  const score = useGameState((s) => s.score);
  const level = useGameState((s) => s.level);
  const difficulty = useGameState((s) => s.difficulty);
  const startGame = useGameState((s) => s.startGame);
  const backToStart = useGameState((s) => s.backToStart);
  const showShop = useGameState((s) => s.showShop);
  const orangesEarned = useGameState((s) => s.orangesEarned);
  const lastScoreRank = useGameState((s) => s.lastScoreRank);
  const lastScoreIsNewBest = useGameState((s) => s.lastScoreIsNewBest);

  if (screen !== "gameOver") return null;

  const diffCfg = DIFFICULTY_CONFIG[difficulty];
  const displayScore = Math.round(score * diffCfg.scoreMultiplier);

  return (
    <div style={{
      ...overlayBase,
      background: "radial-gradient(ellipse at center, rgba(40,10,0,0.95) 0%, rgba(15,5,0,0.98) 100%)",
    }}>
      <ScanlineOverlay />
      <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        <FadeInItem delay={100}>
          <div style={{
            fontSize: 10,
            fontFamily: THEME.fonts.heading,
            color: "rgba(204,34,51,0.5)",
            textTransform: "uppercase",
            letterSpacing: 6,
            marginBottom: 8,
          }}>
            Mission Failed
          </div>
        </FadeInItem>

        <FadeInItem delay={300}>
          <h1 style={{
            fontSize: 52,
            fontWeight: 900,
            fontFamily: THEME.fonts.heading,
            color: THEME.colors.danger,
            margin: 0,
            marginBottom: 8,
            textShadow: THEME.glow.danger,
            letterSpacing: 4,
          }}>
            GAME OVER
          </h1>
        </FadeInItem>

        {lastScoreIsNewBest && (
          <FadeInItem delay={400}>
            <NewBestBadge />
          </FadeInItem>
        )}

        <FadeInItem delay={500}>
          <div style={{
            width: 80,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${THEME.colors.danger}, transparent)`,
            margin: "16px auto 32px",
          }} />
        </FadeInItem>

        <div style={{ display: "flex", gap: 20, marginBottom: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <StatCard label="Level" value={level} color={THEME.colors.text} delay={600} />
          <StatCard label="Score" value={displayScore.toLocaleString()} color={THEME.colors.gold} delay={700} />
          <StatCard label="Oranges" value={`+${orangesEarned}`} color="#ff8c00" delay={750} />
          <StatCard label="Difficulty" value={diffCfg.label} color={diffCfg.color} delay={800} />
          {lastScoreRank > 0 && lastScoreRank <= 10 && (
            <StatCard label="Rank" value={`#${lastScoreRank}`} color={THEME.colors.primary} delay={900} />
          )}
        </div>

        <FadeInItem delay={1000}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <GameButton onClick={startGame} color="rgba(204,34,51,0.4)" glowColor={THEME.colors.dangerGlow}>
              Try Again
            </GameButton>
            <GameButton onClick={showShop} color="rgba(255,140,0,0.25)" glowColor="#ff8c0060" small>
              Upgrade Shop
            </GameButton>
            <GameButton onClick={backToStart} color="rgba(255,165,0,0.15)" glowColor={THEME.colors.goldGlow} small>
              Menu
            </GameButton>
          </div>
        </FadeInItem>
      </div>
    </div>
  );
}

export function LevelCompleteScreen() {
  const screen = useGameState((s) => s.screen);
  const score = useGameState((s) => s.score);
  const level = useGameState((s) => s.level);
  const nextLevel = useGameState((s) => s.nextLevel);
  const showShop = useGameState((s) => s.showShop);
  const orangesEarned = useGameState((s) => s.orangesEarned);

  if (screen !== "levelComplete") return null;

  const nextTheme = getThemeForLevel(Math.min(level + 1, 5));

  return (
    <div style={{
      ...overlayBase,
      background: "radial-gradient(ellipse at center, rgba(20,30,10,0.95) 0%, rgba(8,12,4,0.98) 100%)",
    }}>
      <ScanlineOverlay />
      <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        <FadeInItem delay={100}>
          <div style={{
            fontSize: 10,
            fontFamily: THEME.fonts.heading,
            color: "rgba(68,204,136,0.5)",
            textTransform: "uppercase",
            letterSpacing: 6,
            marginBottom: 8,
          }}>
            Stage Clear
          </div>
        </FadeInItem>

        <FadeInItem delay={300}>
          <h1 style={{
            fontSize: 48,
            fontWeight: 900,
            fontFamily: THEME.fonts.heading,
            color: THEME.colors.accent,
            margin: 0,
            marginBottom: 8,
            textShadow: THEME.glow.accent,
            letterSpacing: 3,
          }}>
            LEVEL {level} COMPLETE
          </h1>
        </FadeInItem>

        <FadeInItem delay={500}>
          <div style={{
            width: 80,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${THEME.colors.accent}, transparent)`,
            margin: "16px auto 24px",
          }} />
        </FadeInItem>

        <div style={{ display: "flex", gap: 20, marginBottom: 16, justifyContent: "center" }}>
          <StatCard label="Level" value={level} color={THEME.colors.accent} delay={600} />
          <StatCard label="Total Score" value={score.toLocaleString()} color={THEME.colors.gold} delay={750} />
          <StatCard label="Oranges" value={orangesEarned} color="#ff8c00" delay={850} />
        </div>

        {level < 5 && (
          <FadeInItem delay={800}>
            <div style={{
              background: THEME.colors.panel,
              border: `1px solid ${THEME.colors.panelBorder}`,
              borderRadius: 8,
              padding: "12px 20px",
              marginBottom: 24,
              backdropFilter: "blur(12px)",
            }}>
              <div style={{
                fontSize: 9,
                fontFamily: THEME.fonts.heading,
                color: THEME.colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 2,
                marginBottom: 4,
              }}>
                Next Environment
              </div>
              <div style={{
                fontSize: 16,
                fontFamily: THEME.fonts.heading,
                fontWeight: 700,
                color: THEME.colors.primary,
              }}>
                {nextTheme.name}
              </div>
            </div>
          </FadeInItem>
        )}

        <FadeInItem delay={900}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <GameButton onClick={nextLevel} color="rgba(68,204,136,0.25)" glowColor={THEME.colors.accentGlow}>
              Next Level
            </GameButton>
            <GameButton onClick={showShop} color="rgba(255,140,0,0.25)" glowColor="#ff8c0060" small>
              Upgrade Shop
            </GameButton>
          </div>
        </FadeInItem>
      </div>
    </div>
  );
}

function UpgradeCard({ upgradeId, level: upgradeLevel, oranges, onBuy }: { upgradeId: UpgradeId; level: number; oranges: number; onBuy: (id: UpgradeId) => void }) {
  const [hovered, setHovered] = useState(false);
  const upgrade = UPGRADES.find((u) => u.id === upgradeId)!;
  const isMaxed = upgradeLevel >= upgrade.maxLevel;
  const cost = isMaxed ? 0 : getUpgradeCost(upgrade, upgradeLevel);
  const canAfford = oranges >= cost && !isMaxed;

  return (
    <div
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.05)" : THEME.colors.panel,
        border: `1px solid ${isMaxed ? "rgba(68,204,136,0.3)" : hovered ? "rgba(255,255,255,0.15)" : THEME.colors.panelBorder}`,
        borderRadius: 10,
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 160,
        maxWidth: 200,
        transition: "all 0.2s ease",
        transform: hovered && !isMaxed ? "translateY(-2px)" : "none",
        boxShadow: hovered && canAfford ? `0 4px 20px ${upgrade.color}30` : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 22 }}>{upgrade.icon}</span>
        <span style={{
          fontSize: 9,
          fontFamily: THEME.fonts.heading,
          color: isMaxed ? THEME.colors.accent : upgrade.color,
          letterSpacing: 1,
          textTransform: "uppercase",
          fontWeight: 700,
        }}>
          {isMaxed ? "MAX" : `Lv ${upgradeLevel}/${upgrade.maxLevel}`}
        </span>
      </div>

      <div style={{
        fontSize: 14,
        fontFamily: THEME.fonts.heading,
        fontWeight: 700,
        color: THEME.colors.text,
      }}>
        {upgrade.name}
      </div>

      <div style={{
        fontSize: 11,
        color: THEME.colors.textDim,
        lineHeight: 1.4,
      }}>
        {upgrade.description}
      </div>

      <div style={{
        fontSize: 10,
        fontFamily: THEME.fonts.heading,
        color: upgrade.color,
        letterSpacing: 0.5,
      }}>
        {upgrade.perLevel}
      </div>

      <div style={{
        width: "100%",
        height: 3,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 2,
        marginTop: 2,
      }}>
        <div style={{
          width: `${(upgradeLevel / upgrade.maxLevel) * 100}%`,
          height: "100%",
          background: isMaxed ? THEME.colors.accent : upgrade.color,
          borderRadius: 2,
          transition: "width 0.3s ease",
        }} />
      </div>

      {!isMaxed && (
        <button
          onClick={() => canAfford && onBuy(upgradeId)}
          style={{
            marginTop: 4,
            padding: "8px 0",
            fontSize: 11,
            fontWeight: 700,
            fontFamily: THEME.fonts.heading,
            border: `1px solid ${canAfford ? upgrade.color + "60" : "rgba(255,255,255,0.06)"}`,
            borderRadius: 6,
            cursor: canAfford ? "pointer" : "not-allowed",
            background: canAfford ? `${upgrade.color}18` : "rgba(255,255,255,0.02)",
            color: canAfford ? upgrade.color : THEME.colors.textMuted,
            letterSpacing: 2,
            textTransform: "uppercase",
            transition: "all 0.2s ease",
            opacity: canAfford ? 1 : 0.5,
          }}
        >
          {cost} Oranges
        </button>
      )}
    </div>
  );
}

export function ShopScreen() {
  const screen = useGameState((s) => s.screen);
  const meta = useGameState((s) => s.meta);
  const refreshMeta = useGameState((s) => s.refreshMeta);
  const backToStart = useGameState((s) => s.backToStart);

  if (screen !== "shop") return null;

  const handleBuy = (id: UpgradeId) => {
    const result = purchaseUpgrade(meta, id);
    if (result) {
      refreshMeta();
    }
  };

  return (
    <div style={{ ...overlayBase, background: THEME.colors.bgDark, overflowY: "auto" }}>
      <ParticleBackground />
      <ScanlineOverlay />

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 780, width: "100%", padding: "40px 20px" }}>
        <FadeInItem delay={100}>
          <div style={{
            fontSize: 10,
            fontFamily: THEME.fonts.heading,
            color: "rgba(255,140,0,0.5)",
            textTransform: "uppercase",
            letterSpacing: 6,
            marginBottom: 8,
          }}>
            Permanent Upgrades
          </div>
        </FadeInItem>

        <FadeInItem delay={200}>
          <h1 style={{
            fontSize: 42,
            fontWeight: 900,
            fontFamily: THEME.fonts.heading,
            margin: 0,
            marginBottom: 8,
            background: `linear-gradient(135deg, #ff8c00, ${THEME.colors.gold})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: 4,
          }}>
            UPGRADE SHOP
          </h1>
        </FadeInItem>

        <FadeInItem delay={300}>
          <div style={{
            width: 80,
            height: 2,
            background: "linear-gradient(90deg, transparent, #ff8c00, transparent)",
            margin: "12px auto 20px",
          }} />
        </FadeInItem>

        <FadeInItem delay={350}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,140,0,0.1)",
            border: "1px solid rgba(255,140,0,0.3)",
            borderRadius: 20,
            padding: "8px 24px",
            marginBottom: 28,
          }}>
            <span style={{ fontSize: 20 }}>🍊</span>
            <span style={{
              fontSize: 24,
              fontFamily: THEME.fonts.heading,
              fontWeight: 800,
              color: "#ff8c00",
            }}>
              {meta.oranges}
            </span>
            <span style={{
              fontSize: 10,
              fontFamily: THEME.fonts.heading,
              color: THEME.colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}>
              Oranges
            </span>
          </div>
        </FadeInItem>

        <FadeInItem delay={400}>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            justifyContent: "center",
            marginBottom: 28,
          }}>
            {UPGRADES.map((upgrade, i) => (
              <FadeInItem key={upgrade.id} delay={450 + i * 80}>
                <UpgradeCard
                  upgradeId={upgrade.id}
                  level={meta.upgradeLevels[upgrade.id]}
                  oranges={meta.oranges}
                  onBuy={handleBuy}
                />
              </FadeInItem>
            ))}
          </div>
        </FadeInItem>

        <FadeInItem delay={950}>
          <div style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            <div style={{
              display: "flex",
              gap: 20,
              fontSize: 10,
              fontFamily: THEME.fonts.heading,
              color: THEME.colors.textMuted,
              letterSpacing: 1,
              alignItems: "center",
            }}>
              <span>Total Earned: {meta.totalOrangesEarned} 🍊</span>
              <span>Runs: {meta.totalRuns}</span>
            </div>
          </div>
        </FadeInItem>

        <FadeInItem delay={1050}>
          <div style={{ marginTop: 20 }}>
            <GameButton onClick={backToStart} color="rgba(255,165,0,0.2)" glowColor={THEME.colors.goldGlow}>
              Back to Menu
            </GameButton>
          </div>
        </FadeInItem>
      </div>
    </div>
  );
}

export function VictoryScreen() {
  const screen = useGameState((s) => s.screen);
  const score = useGameState((s) => s.score);
  const difficulty = useGameState((s) => s.difficulty);
  const startGame = useGameState((s) => s.startGame);
  const backToStart = useGameState((s) => s.backToStart);
  const showShop = useGameState((s) => s.showShop);
  const orangesEarned = useGameState((s) => s.orangesEarned);
  const lastScoreRank = useGameState((s) => s.lastScoreRank);
  const lastScoreIsNewBest = useGameState((s) => s.lastScoreIsNewBest);

  if (screen !== "victory") return null;

  const diffCfg = DIFFICULTY_CONFIG[difficulty];
  const displayScore = Math.round(score * diffCfg.scoreMultiplier);

  return (
    <div style={{
      ...overlayBase,
      background: "radial-gradient(ellipse at center, rgba(30,25,0,0.95) 0%, rgba(8,5,0,0.98) 100%)",
    }}>
      <ParticleBackground />
      <ScanlineOverlay />
      <div style={{ position: "relative", zIndex: 2, textAlign: "center" }}>
        <FadeInItem delay={100}>
          <div style={{
            fontSize: 10,
            fontFamily: THEME.fonts.heading,
            color: "rgba(255,165,0,0.5)",
            textTransform: "uppercase",
            letterSpacing: 6,
            marginBottom: 8,
          }}>
            All Dungeons Conquered
          </div>
        </FadeInItem>

        <FadeInItem delay={300}>
          <h1 style={{
            fontSize: 52,
            fontWeight: 900,
            fontFamily: THEME.fonts.heading,
            margin: 0,
            marginBottom: 8,
            background: `linear-gradient(135deg, ${THEME.colors.gold}, ${THEME.colors.accent})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: 4,
          }}>
            VICTORY
          </h1>
        </FadeInItem>

        {lastScoreIsNewBest && (
          <FadeInItem delay={400}>
            <NewBestBadge />
          </FadeInItem>
        )}

        <FadeInItem delay={500}>
          <div style={{
            width: 80,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${THEME.colors.gold}, transparent)`,
            margin: "16px auto 32px",
          }} />
        </FadeInItem>

        <FadeInItem delay={600}>
          <p style={{
            color: THEME.colors.textDim,
            fontSize: 15,
            marginBottom: 24,
            lineHeight: 1.6,
          }}>
            You've conquered all 5 levels of the dungeon.
            <br />A true Maze Runner.
          </p>
        </FadeInItem>

        <div style={{ display: "flex", gap: 20, marginBottom: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <StatCard label="Levels" value="5/5" color={THEME.colors.accent} delay={700} />
          <StatCard label="Final Score" value={displayScore.toLocaleString()} color={THEME.colors.gold} delay={800} />
          <StatCard label="Oranges" value={`+${orangesEarned}`} color="#ff8c00" delay={850} />
          <StatCard label="Difficulty" value={diffCfg.label} color={diffCfg.color} delay={900} />
          {lastScoreRank > 0 && lastScoreRank <= 10 && (
            <StatCard label="Rank" value={`#${lastScoreRank}`} color={THEME.colors.primary} delay={1000} />
          )}
        </div>

        <FadeInItem delay={1100}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <GameButton onClick={startGame} color="rgba(255,165,0,0.25)" glowColor={THEME.colors.goldGlow}>
              Play Again
            </GameButton>
            <GameButton onClick={showShop} color="rgba(255,140,0,0.25)" glowColor="#ff8c0060" small>
              Upgrade Shop
            </GameButton>
            <GameButton onClick={backToStart} color="rgba(255,165,0,0.15)" glowColor={THEME.colors.goldGlow} small>
              Menu
            </GameButton>
          </div>
        </FadeInItem>
      </div>
    </div>
  );
}
