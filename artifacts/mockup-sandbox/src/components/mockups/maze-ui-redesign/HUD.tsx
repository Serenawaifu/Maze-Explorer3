import React, { useState, useEffect } from 'react';
import './_group.css';

const HUD: React.FC = () => {
  // Mock data
  const [health, setHealth] = useState(75);
  const maxHealth = 100;
  const level = 3;
  const [score, setScore] = useState(8450);
  const oranges = 5;
  const maxOranges = 8;
  const bossHealth = 60;
  const maxBossHealth = 100;
  const powerUpTime = 12; // seconds remaining
  const maxPowerUpTime = 30;

  // Add a simple pulse effect for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setHealth((prev) => (prev > 70 ? prev - 5 : 75));
      setScore((prev) => prev + 15);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hud-container">
      <style>{`
        .hud-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          background: radial-gradient(circle at center, transparent 30%, rgba(10, 5, 2, 0.8) 100%), 
                      url('https://images.unsplash.com/photo-1601369345758-1033cb245814?q=80&w=2000&auto=format&fit=crop') center/cover;
          overflow: hidden;
          font-family: var(--font-body);
          color: var(--text);
          user-select: none;
        }

        .hud-panel {
          background: var(--panel);
          border: 1px solid var(--panel-border);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(210, 136, 42, 0.05);
          backdrop-filter: blur(8px);
          border-radius: 12px;
        }

        /* Top Left: Health */
        .health-bar-container {
          position: absolute;
          top: 30px;
          left: 40px;
          display: flex;
          align-items: center;
          gap: 15px;
          filter: drop-shadow(0 0 10px rgba(68, 204, 136, 0.2));
        }

        .health-globe {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 2px solid var(--panel-border-bright);
          background: rgba(10, 5, 2, 0.9);
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 15px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .health-liquid {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(to top, var(--danger), var(--health));
          transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0.85;
        }

        .health-liquid::before {
          content: '';
          position: absolute;
          top: -10px;
          left: 0;
          width: 200%;
          height: 20px;
          background: radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, transparent 70%);
          animation: wave 4s linear infinite;
        }

        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .health-value {
          position: relative;
          font-family: var(--font-heading);
          font-size: 28px;
          font-weight: 800;
          color: white;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
          z-index: 2;
        }

        .health-curved-bar {
          width: 200px;
          height: 20px;
          background: rgba(0,0,0,0.6);
          border-radius: 10px;
          border: 1px solid var(--panel-border);
          overflow: hidden;
          position: relative;
          box-shadow: inset 0 2px 5px rgba(0,0,0,0.8);
        }

        .health-curved-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--health-low), var(--health));
          box-shadow: 0 0 10px var(--health);
          transition: width 0.3s ease;
        }

        /* Top Center: Compass */
        .compass-container {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 400px;
          height: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .compass-bar {
          width: 100%;
          height: 30px;
          background: linear-gradient(90deg, transparent, rgba(28, 18, 10, 0.8), transparent);
          border-top: 1px solid rgba(210, 140, 60, 0.3);
          border-bottom: 1px solid rgba(210, 140, 60, 0.3);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .compass-ticks {
          display: flex;
          gap: 30px;
          font-family: var(--font-heading);
          font-size: 14px;
          color: var(--text-dim);
          letter-spacing: 2px;
          text-shadow: 0 0 5px rgba(210, 136, 42, 0.5);
          transform: translateX(10%); /* Simulated rotation */
        }
        
        .compass-marker {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 100%;
          background: var(--gold);
          box-shadow: 0 0 8px var(--gold);
        }

        /* Top Right: Minimap & Stats */
        .top-right-group {
          position: absolute;
          top: 30px;
          right: 40px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 20px;
        }

        .minimap-wrapper {
          width: 220px;
          height: 220px;
          border-radius: 50%;
          padding: 6px;
          background: linear-gradient(135deg, var(--primary), var(--bg-dark));
          box-shadow: 0 0 20px rgba(210, 136, 42, 0.2);
          position: relative;
        }

        .minimap-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: var(--bg-dark);
          overflow: hidden;
          position: relative;
          border: 2px solid rgba(0,0,0,0.8);
        }

        .minimap-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(210, 136, 42, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(210, 136, 42, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
          background-position: center center;
          opacity: 0.5;
        }
        
        .minimap-fog {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.9) 80%);
        }

        .minimap-player {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: var(--accent);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--accent), 0 0 20px var(--accent);
        }

        .minimap-enemy {
          position: absolute;
          top: 30%;
          left: 60%;
          width: 6px;
          height: 6px;
          background: var(--danger);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--danger);
        }

        .minimap-direction {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-bottom: 12px solid rgba(255,255,255,0.8);
          transform: translate(-50%, -100%) rotate(45deg);
          transform-origin: bottom center;
        }

        .stats-panel {
          padding: 15px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 220px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          font-size: 12px;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 1px;
        }

        .stat-value {
          font-family: var(--font-mono);
          font-size: 18px;
          font-weight: 600;
          color: var(--primary);
          text-shadow: 0 0 8px var(--primary-glow);
        }

        .orange-progress {
          margin-top: 5px;
        }
        
        .orange-dots {
          display: flex;
          gap: 4px;
          margin-top: 6px;
        }

        .orange-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 165, 0, 0.2);
          border: 1px solid rgba(255, 165, 0, 0.4);
        }

        .orange-dot.active {
          background: var(--gold);
          box-shadow: 0 0 8px var(--gold-glow);
          border-color: #fff;
        }

        /* Left Side: Power-ups */
        .powerups-container {
          position: absolute;
          left: 40px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .powerup-item {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          background: rgba(10, 5, 2, 0.6);
          border: 1px solid var(--accent);
          box-shadow: 0 0 15px var(--accent-glow), inset 0 0 10px rgba(68, 204, 136, 0.2);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .powerup-icon {
          font-size: 24px;
          color: var(--accent);
          z-index: 2;
        }

        .powerup-timer {
          position: absolute;
          bottom: -24px;
          font-family: var(--font-mono);
          font-size: 14px;
          color: var(--text);
          text-shadow: 0 0 4px var(--accent);
        }

        .powerup-progress {
          position: absolute;
          inset: -2px;
          border-radius: 14px;
          background: conic-gradient(var(--accent) var(--p), transparent 0);
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 2px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 2px));
        }

        /* Center: Crosshair */
        .crosshair {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          pointer-events: none;
        }

        .crosshair-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 4px;
          height: 4px;
          background: rgba(255,255,255,0.8);
          border-radius: 50%;
          box-shadow: 0 0 5px rgba(255,255,255,0.5);
        }

        .crosshair-arc {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
          transform: rotate(-45deg);
        }

        /* Bottom Center: Boss Health */
        .boss-health-container {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .boss-name {
          font-family: var(--font-heading);
          font-size: 20px;
          color: var(--danger);
          text-transform: uppercase;
          letter-spacing: 4px;
          text-shadow: 0 0 10px var(--danger-glow);
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .boss-name::before, .boss-name::after {
          content: '◆';
          font-size: 12px;
          color: var(--danger);
          opacity: 0.5;
        }

        .boss-bar-wrapper {
          width: 100%;
          height: 12px;
          background: rgba(0,0,0,0.8);
          border: 1px solid rgba(204, 34, 51, 0.3);
          border-radius: 2px;
          position: relative;
          box-shadow: 0 4px 10px rgba(0,0,0,0.8);
        }

        .boss-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #800000, var(--danger));
          box-shadow: 0 0 15px var(--danger-glow);
          transition: width 0.3s ease;
          position: relative;
        }
        
        .boss-bar-fill::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 2px;
          height: 100%;
          background: #fff;
          box-shadow: 0 0 8px #fff;
        }

        .boss-phases {
          position: absolute;
          top: -4px;
          left: 0;
          width: 100%;
          height: 20px;
          display: flex;
          justify-content: space-evenly;
          pointer-events: none;
        }

        .boss-phase-marker {
          width: 2px;
          height: 100%;
          background: rgba(0,0,0,0.8);
          box-shadow: 1px 0 0 rgba(255,255,255,0.2);
        }

        /* Bottom Left: Volume */
        .volume-control {
          position: absolute;
          bottom: 40px;
          left: 40px;
          width: 44px;
          height: 44px;
          border-radius: 22px;
          background: var(--panel);
          border: 1px solid var(--panel-border);
          display: flex;
          align-items: center;
          padding: 0 12px;
          cursor: pointer;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
        }

        .volume-control:hover {
          width: 150px;
          background: rgba(40, 25, 15, 0.95);
          border-color: var(--primary);
        }

        .volume-icon {
          font-size: 18px;
          color: var(--text-dim);
          min-width: 20px;
          transition: color 0.3s;
        }

        .volume-control:hover .volume-icon {
          color: var(--text);
        }

        .volume-slider {
          margin-left: 15px;
          width: 80px;
          height: 4px;
          background: rgba(0,0,0,0.6);
          border-radius: 2px;
          position: relative;
          opacity: 0;
          transition: opacity 0.3s;
          transition-delay: 0.1s;
        }

        .volume-control:hover .volume-slider {
          opacity: 1;
        }

        .volume-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 70%;
          background: var(--primary);
          border-radius: 2px;
          box-shadow: 0 0 5px var(--primary-glow);
        }
        
        .volume-thumb {
          position: absolute;
          top: 50%;
          left: 70%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 5px rgba(0,0,0,0.5);
        }
      `}</style>

      {/* Top Left: Health */}
      <div className="health-bar-container">
        <div className="health-globe">
          <div className="health-liquid" style={{ height: `${(health / maxHealth) * 100}%` }} />
          <div className="health-value">{health}</div>
        </div>
        <div className="health-curved-bar">
          <div className="health-curved-fill" style={{ width: `${(health / maxHealth) * 100}%` }} />
        </div>
      </div>

      {/* Top Center: Compass */}
      <div className="compass-container">
        <div className="compass-bar">
          <div className="compass-marker"></div>
          <div className="compass-ticks">
            <span>W</span>
            <span>|</span>
            <span>NW</span>
            <span>|</span>
            <span style={{ color: 'var(--text)', textShadow: '0 0 8px var(--text)' }}>N</span>
            <span>|</span>
            <span>NE</span>
            <span>|</span>
            <span>E</span>
          </div>
        </div>
      </div>

      {/* Top Right: Minimap & Stats */}
      <div className="top-right-group">
        <div className="minimap-wrapper">
          <div className="minimap-inner">
            <div className="minimap-grid"></div>
            <div className="minimap-fog"></div>
            <div className="minimap-player"></div>
            <div className="minimap-direction"></div>
            <div className="minimap-enemy"></div>
            <div className="minimap-enemy" style={{ top: '60%', left: '70%' }}></div>
          </div>
        </div>

        <div className="hud-panel stats-panel">
          <div className="stat-row">
            <span className="stat-label">Level</span>
            <span className="stat-value">{level}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Score</span>
            <span className="stat-value">{score.toLocaleString()}</span>
          </div>
          <div className="orange-progress">
            <div className="stat-row">
              <span className="stat-label">Oranges</span>
              <span className="stat-value" style={{ color: 'var(--gold)', textShadow: '0 0 8px var(--gold-glow)' }}>
                {oranges}/{maxOranges}
              </span>
            </div>
            <div className="orange-dots">
              {Array.from({ length: maxOranges }).map((_, i) => (
                <div key={i} className={`orange-dot ${i < oranges ? 'active' : ''}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Left Side: Power-ups */}
      <div className="powerups-container">
        <div className="powerup-item">
          <div 
            className="powerup-progress" 
            style={{ '--p': `${(powerUpTime / maxPowerUpTime) * 100}%` } as React.CSSProperties}
          />
          <span className="powerup-icon">⚡</span>
          <div className="powerup-timer">{powerUpTime}s</div>
        </div>
      </div>

      {/* Center: Crosshair */}
      <div className="crosshair">
        <div className="crosshair-dot"></div>
        <div className="crosshair-arc"></div>
      </div>

      {/* Bottom Center: Boss Health */}
      <div className="boss-health-container">
        <div className="boss-name">Minotaur King</div>
        <div className="boss-bar-wrapper">
          <div className="boss-bar-fill" style={{ width: `${(bossHealth / maxBossHealth) * 100}%` }} />
          <div className="boss-phases">
            <div className="boss-phase-marker" />
            <div className="boss-phase-marker" />
          </div>
        </div>
      </div>

      {/* Bottom Left: Volume */}
      <div className="volume-control">
        <div className="volume-icon">🔊</div>
        <div className="volume-slider">
          <div className="volume-fill"></div>
          <div className="volume-thumb"></div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
