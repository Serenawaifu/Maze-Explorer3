import React, { useEffect, useRef, useState } from 'react';
import './_group.css';

const StartScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      life: number;
      maxLife: number;
      opacity: number;
      flickerOffset: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const createParticle = () => {
      // Spawn mostly from the bottom, or random
      const isBottomSpawn = Math.random() > 0.3;
      return {
        x: Math.random() * canvas.width,
        y: isBottomSpawn ? canvas.height + 10 : Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 1.5,
        speedY: (Math.random() * -2) - 0.5,
        life: 0,
        maxLife: Math.random() * 150 + 50,
        opacity: Math.random() * 0.5 + 0.3,
        flickerOffset: Math.random() * Math.PI * 2,
      };
    };

    // Initialize with some particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        ...createParticle(),
        y: Math.random() * canvas.height, // distribute evenly at start
      });
    }

    const render = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (particles.length < 80 && Math.random() < 0.2) {
        particles.push(createParticle());
      }

      particles.forEach((p, index) => {
        p.life++;
        p.x += p.speedX;
        p.y += p.speedY;
        
        // Add slight drift
        p.x += Math.sin(time * 0.001 + p.flickerOffset) * 0.5;

        const lifeRatio = p.life / p.maxLife;
        const currentOpacity = (1 - lifeRatio) * p.opacity * (0.8 + Math.sin(time * 0.01 + p.flickerOffset) * 0.2);

        if (lifeRatio >= 1 || p.y < -10) {
          particles.splice(index, 1);
          return;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        // Ember color: starts yellow-white, goes to orange, then dark red
        let color = '';
        if (lifeRatio < 0.2) {
          color = `rgba(255, 230, 150, ${currentOpacity})`; // Bright yellow/white
        } else if (lifeRatio < 0.6) {
          color = `rgba(255, 140, 0, ${currentOpacity})`; // Orange
        } else {
          color = `rgba(200, 40, 0, ${currentOpacity * 0.5})`; // Dark red, fading out
        }

        // Add glow
        ctx.shadowBlur = p.size * 3;
        ctx.shadowColor = `rgba(255, 100, 0, ${currentOpacity * 0.8})`;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const buttonStyle = (isHovered: boolean): React.CSSProperties => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '16px 24px',
    backgroundColor: isHovered ? 'rgba(210, 136, 42, 0.15)' : 'var(--panel)',
    border: `1px solid ${isHovered ? 'var(--primary)' : 'var(--panel-border-bright)'}`,
    borderRadius: '4px',
    color: isHovered ? '#fff' : 'var(--text)',
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    fontWeight: '600',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    boxShadow: isHovered 
      ? `0 0 15px var(--primary-glow), inset 0 0 10px rgba(210, 136, 42, 0.2)` 
      : '0 4px 6px rgba(0,0,0,0.5)',
    transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
  });

  const beveledEdgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderTop: '1px solid rgba(255,255,255,0.1)',
    borderLeft: '1px solid rgba(255,255,255,0.1)',
    borderBottom: '1px solid rgba(0,0,0,0.5)',
    borderRight: '1px solid rgba(0,0,0,0.5)',
    pointerEvents: 'none',
  };

  const menuButtons = [
    { id: 'enter', label: 'Enter the Maze', color: 'var(--primary)' },
    { id: 'shop', label: 'Shop', color: 'var(--gold)' },
    { id: 'journal', label: 'Lore Journal', color: 'var(--accent)' },
    { id: 'leaderboard', label: 'Leaderboard', color: 'var(--primary)' }
  ];

  const controls = [
    { icon: 'W A S D', label: 'MOVE' },
    { icon: 'SHIFT', label: 'SPRINT' },
    { icon: 'SPACE', label: 'JUMP' },
    { icon: 'E', label: 'INTERACT' },
  ];

  const stats = [
    { label: 'Total Runs', value: '47' },
    { label: 'Best Score', value: '12,450' },
    { label: 'Oranges', value: '235', color: 'var(--gold)' }
  ];

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, var(--bg) 0%, #050302 100%)',
      overflow: 'hidden',
      color: 'var(--text)',
    }}>
      <style>{`
        @keyframes fogMove {
          0% { background-position: 0% 0%; opacity: 0.1; }
          50% { background-position: 100% 100%; opacity: 0.3; }
          100% { background-position: 200% 0%; opacity: 0.1; }
        }
        
        @keyframes titleShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes scanline {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }

        @keyframes pulseRune {
          0%, 100% { opacity: 0.1; text-shadow: 0 0 5px var(--primary-glow); }
          50% { opacity: 0.5; text-shadow: 0 0 15px var(--primary); }
        }

        @keyframes floatEffect {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animated-gradient-bg {
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: linear-gradient(45deg, rgba(26,15,8,0) 0%, rgba(210,136,42,0.03) 50%, rgba(26,15,8,0) 100%);
          animation: titleShimmer 15s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        .shimmer-text {
          background: linear-gradient(
            90deg, 
            var(--primary) 0%, 
            var(--gold) 20%, 
            #fff 40%, 
            var(--gold) 60%, 
            var(--primary) 100%
          );
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: titleShimmer 4s linear infinite;
        }

        .scanline-overlay {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(
            to bottom,
            transparent 50%,
            rgba(0, 0, 0, 0.25) 51%
          );
          background-size: 100% 4px;
          pointer-events: none;
          z-index: 10;
        }
      `}</style>

      {/* Background Elements */}
      <div className="animated-gradient-bg" />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }} />
      <div className="scanline-overlay" />
      
      {/* Fog Overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.015%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.5%22/%3E%3C/svg%3E")',
        opacity: 0.15,
        mixBlendMode: 'overlay',
        animation: 'fogMove 60s linear infinite',
        zIndex: 3,
        pointerEvents: 'none',
      }} />

      {/* Pulsing Runes in Corners */}
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos, i) => {
        const isTop = pos.includes('top');
        const isLeft = pos.includes('left');
        return (
          <div key={pos} style={{
            position: 'absolute',
            top: isTop ? '30px' : 'auto',
            bottom: !isTop ? '30px' : 'auto',
            left: isLeft ? '40px' : 'auto',
            right: !isLeft ? '40px' : 'auto',
            fontFamily: 'var(--font-heading)',
            fontSize: '42px',
            color: 'var(--primary)',
            animation: `pulseRune ${3 + i * 0.5}s ease-in-out infinite`,
            zIndex: 4,
            pointerEvents: 'none',
            userSelect: 'none',
            opacity: 0.2,
          }}>
            {['ᛗ', 'ᚨ', 'ᛉ', 'ᛖ'][i]}
          </div>
        );
      })}

      {/* Main Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '1200px',
        padding: '40px 20px',
        animation: 'slideUp 1s ease-out',
      }}>
        
        {/* Title Section */}
        <div style={{ textAlign: 'center', marginBottom: '60px', animation: 'floatEffect 6s ease-in-out infinite' }}>
          <h1 className="shimmer-text" style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(64px, 10vw, 120px)',
            fontWeight: '900',
            letterSpacing: '8px',
            margin: '0 0 10px 0',
            textShadow: '0 0 40px var(--primary-glow), 0 10px 20px rgba(0,0,0,0.8)',
            lineHeight: 1,
          }}>
            MAZE RUNNER
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px',
          }}>
            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(90deg, transparent, var(--primary))' }} />
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '22px',
              color: 'var(--text-dim)',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              margin: 0,
            }}>
              A 3D Dungeon Experience
            </p>
            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(-90deg, transparent, var(--primary))' }} />
          </div>
        </div>

        {/* Layout Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px 1fr',
          gap: '40px',
          width: '100%',
          alignItems: 'center',
        }}>
          
          {/* Left Column: Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-muted)',
              fontSize: '14px',
              letterSpacing: '2px',
              borderBottom: '1px solid var(--panel-border)',
              paddingBottom: '8px',
              marginBottom: '10px',
              textAlign: 'right'
            }}>CONTROLS</h3>
            
            {controls.map((ctrl, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '15px',
              }}>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-dim)',
                  fontSize: '16px',
                  letterSpacing: '1px'
                }}>{ctrl.label}</span>
                <div style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  color: 'var(--primary)',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)',
                  minWidth: '40px',
                  textAlign: 'center'
                }}>
                  {ctrl.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Center Column: Menu Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {menuButtons.map((btn, i) => (
              <button
                key={btn.id}
                onMouseEnter={() => setHoveredButton(btn.id)}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  ...buttonStyle(hoveredButton === btn.id),
                  ...(i === 0 ? {
                    padding: '24px',
                    fontSize: '22px',
                    backgroundColor: hoveredButton === btn.id ? 'var(--primary)' : 'rgba(210, 136, 42, 0.2)',
                    color: hoveredButton === btn.id ? '#fff' : 'var(--primary)',
                    boxShadow: hoveredButton === btn.id 
                      ? '0 0 30px var(--primary-glow)' 
                      : '0 0 15px rgba(210, 136, 42, 0.2), inset 0 0 20px rgba(0,0,0,0.8)',
                  } : {})
                }}
              >
                <div style={beveledEdgeStyle} />
                <span style={{ position: 'relative', zIndex: 1 }}>{btn.label}</span>
                
                {hoveredButton === btn.id && (
                  <div style={{
                    position: 'absolute',
                    left: '-100%',
                    top: 0,
                    width: '50%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transform: 'skewX(-20deg)',
                    animation: 'shimmer 0.5s forwards',
                  }} />
                )}
                <style>{`
                  @keyframes shimmer {
                    100% { left: 200%; }
                  }
                `}</style>
              </button>
            ))}
          </div>

          {/* Right Column: Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-muted)',
              fontSize: '14px',
              letterSpacing: '2px',
              borderBottom: '1px solid var(--panel-border)',
              paddingBottom: '8px',
              marginBottom: '10px',
            }}>CURRENT RUNNER</h3>
            
            {stats.map((stat, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '15px',
                background: 'linear-gradient(90deg, rgba(28,18,10,0.8) 0%, transparent 100%)',
                padding: '10px 15px',
                borderLeft: `2px solid ${stat.color || 'var(--primary)'}`,
                borderRadius: '0 4px 4px 0',
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-dim)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>{stat.label}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    color: stat.color || 'var(--text)',
                    fontSize: '20px',
                    fontWeight: '700',
                  }}>{stat.value}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer info */}
        <div style={{
          position: 'absolute',
          bottom: '-80px',
          width: '100%',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          letterSpacing: '1px'
        }}>
          v1.4.2 // CONNECTED TO RELAY
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
