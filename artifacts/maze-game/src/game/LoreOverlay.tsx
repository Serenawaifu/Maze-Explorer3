import { useEffect, useState } from "react";
import { useGameState } from "./gameState";
import { THEME } from "./theme";
import { getDiscoveredLore, LORE_FRAGMENTS } from "./loreFragments";

export function LoreOverlay() {
  const activeLore = useGameState((s) => s.activeLoreEntry);
  const dismissLore = useGameState((s) => s.dismissLore);
  const [visible, setVisible] = useState(false);
  const [textRevealed, setTextRevealed] = useState(0);

  useEffect(() => {
    if (activeLore) {
      setVisible(false);
      setTextRevealed(0);
      const showTimer = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(showTimer);
    } else {
      setVisible(false);
    }
  }, [activeLore]);

  useEffect(() => {
    if (!activeLore || !visible) return;
    const totalLen = activeLore.text.length;
    if (textRevealed >= totalLen) return;
    const speed = 12;
    const timer = setTimeout(() => {
      setTextRevealed((prev) => Math.min(prev + speed, totalLen));
    }, 16);
    return () => clearTimeout(timer);
  }, [activeLore, visible, textRevealed]);

  if (!activeLore) return null;

  const handleDismiss = () => {
    dismissLore();
  };

  const handleSkipOrDismiss = () => {
    if (textRevealed < activeLore.text.length) {
      setTextRevealed(activeLore.text.length);
    } else {
      handleDismiss();
    }
  };

  const revealedText = activeLore.text.substring(0, textRevealed);
  const lines = revealedText.split("\n");

  return (
    <div
      onClick={handleSkipOrDismiss}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 250,
        background: visible ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0)",
        transition: "background 0.5s ease",
        cursor: "pointer",
        fontFamily: THEME.fonts.body,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "90%",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <div style={{
          background: "linear-gradient(135deg, rgba(40,30,15,0.95), rgba(25,18,8,0.98))",
          border: "1px solid rgba(255,215,0,0.3)",
          borderRadius: 12,
          padding: "28px 32px",
          boxShadow: "0 0 40px rgba(255,215,0,0.15), 0 0 80px rgba(170,136,255,0.1), inset 0 1px 0 rgba(255,215,0,0.1)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(90deg, transparent, #ffd700, #aa88ff, #ffd700, transparent)",
          }} />

          <div style={{
            fontSize: 9,
            fontFamily: THEME.fonts.heading,
            color: "rgba(255,215,0,0.5)",
            textTransform: "uppercase",
            letterSpacing: 4,
            marginBottom: 6,
          }}>
            Lore Fragment Discovered
          </div>

          <div style={{
            fontSize: 18,
            fontFamily: THEME.fonts.heading,
            fontWeight: 700,
            color: "#ffd700",
            marginBottom: 16,
            textShadow: "0 0 10px rgba(255,215,0,0.3)",
          }}>
            {activeLore.title}
          </div>

          <div style={{
            fontSize: 14,
            color: "#e8d5a3",
            lineHeight: 1.7,
            minHeight: 80,
            whiteSpace: "pre-wrap",
          }}>
            {lines.map((line, i) => (
              <span key={i}>
                {line}
                {i < lines.length - 1 && <br />}
              </span>
            ))}
            {textRevealed < activeLore.text.length && (
              <span style={{
                display: "inline-block",
                width: 2,
                height: 14,
                background: "#ffd700",
                marginLeft: 2,
                animation: "blink 0.8s infinite",
              }} />
            )}
          </div>

          <div style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid rgba(255,215,0,0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div style={{
              fontSize: 11,
              fontStyle: "italic",
              color: "rgba(232,213,163,0.6)",
            }}>
              -- {activeLore.author}
            </div>
            <div style={{
              fontSize: 9,
              fontFamily: THEME.fonts.heading,
              color: "rgba(255,215,0,0.4)",
              textTransform: "uppercase",
              letterSpacing: 2,
            }}>
              {textRevealed < activeLore.text.length ? "Click to reveal" : "Click to close"}
            </div>
          </div>
        </div>

        <div style={{
          textAlign: "center",
          marginTop: 12,
          fontSize: 10,
          fontFamily: THEME.fonts.heading,
          color: "rgba(255,215,0,0.3)",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}>
          +50 Points
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function LoreJournal({ onClose }: { onClose: () => void }) {
  const discovered = getDiscoveredLore();
  const total = LORE_FRAGMENTS.length;
  const discoveredCount = discovered.size;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedEntry = selectedId ? LORE_FRAGMENTS.find((l) => l.id === selectedId) : null;

  const levels = [1, 2, 3, 4, 5];
  const levelNames = ["Stone Dungeon", "Mossy Catacombs", "Lava Caves", "Frozen Crypts", "Shadow Realm"];

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 250,
      background: "rgba(0,0,0,0.8)",
      fontFamily: THEME.fonts.body,
    }}>
      <div style={{
        maxWidth: 640,
        width: "90%",
        maxHeight: "80vh",
        overflowY: "auto",
        background: "linear-gradient(135deg, rgba(30,22,10,0.98), rgba(15,10,5,0.99))",
        border: "1px solid rgba(255,215,0,0.25)",
        borderRadius: 12,
        padding: "24px 28px",
        boxShadow: "0 0 40px rgba(255,215,0,0.1)",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}>
          <div>
            <div style={{
              fontSize: 9,
              fontFamily: THEME.fonts.heading,
              color: "rgba(255,215,0,0.5)",
              textTransform: "uppercase",
              letterSpacing: 4,
              marginBottom: 4,
            }}>
              Collected Writings
            </div>
            <div style={{
              fontSize: 22,
              fontFamily: THEME.fonts.heading,
              fontWeight: 700,
              color: "#ffd700",
            }}>
              Lore Journal
            </div>
          </div>
          <div style={{
            fontSize: 13,
            fontFamily: THEME.fonts.heading,
            color: "rgba(255,215,0,0.6)",
          }}>
            {discoveredCount} / {total}
          </div>
        </div>

        {selectedEntry ? (
          <div>
            <button
              onClick={() => setSelectedId(null)}
              style={{
                background: "none",
                border: "1px solid rgba(255,215,0,0.2)",
                borderRadius: 4,
                color: "#ffd700",
                fontSize: 10,
                fontFamily: THEME.fonts.heading,
                padding: "4px 12px",
                cursor: "pointer",
                marginBottom: 16,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Back
            </button>

            <div style={{
              fontSize: 18,
              fontFamily: THEME.fonts.heading,
              fontWeight: 700,
              color: "#ffd700",
              marginBottom: 12,
            }}>
              {selectedEntry.title}
            </div>
            <div style={{
              fontSize: 14,
              color: "#e8d5a3",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
              marginBottom: 16,
            }}>
              {selectedEntry.text}
            </div>
            <div style={{
              fontSize: 11,
              fontStyle: "italic",
              color: "rgba(232,213,163,0.5)",
            }}>
              -- {selectedEntry.author}
            </div>
          </div>
        ) : (
          <div>
            {levels.map((lvl, li) => {
              const fragments = LORE_FRAGMENTS.filter((l) => l.level === lvl);
              return (
                <div key={lvl} style={{ marginBottom: 16 }}>
                  <div style={{
                    fontSize: 10,
                    fontFamily: THEME.fonts.heading,
                    color: "rgba(255,215,0,0.4)",
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    marginBottom: 6,
                  }}>
                    Level {lvl} - {levelNames[li]}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {fragments.map((frag) => {
                      const isDiscovered = discovered.has(frag.id);
                      return (
                        <button
                          key={frag.id}
                          onClick={() => isDiscovered && setSelectedId(frag.id)}
                          style={{
                            padding: "6px 14px",
                            fontSize: 11,
                            fontFamily: THEME.fonts.heading,
                            background: isDiscovered ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isDiscovered ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.06)"}`,
                            borderRadius: 6,
                            color: isDiscovered ? "#e8d5a3" : "rgba(255,255,255,0.2)",
                            cursor: isDiscovered ? "pointer" : "default",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {isDiscovered ? frag.title : "???"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            onClick={onClose}
            style={{
              padding: "10px 32px",
              fontSize: 11,
              fontWeight: 700,
              fontFamily: THEME.fonts.heading,
              border: "1px solid rgba(255,215,0,0.3)",
              borderRadius: 6,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: 2,
              background: "rgba(255,215,0,0.08)",
              color: "#ffd700",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
