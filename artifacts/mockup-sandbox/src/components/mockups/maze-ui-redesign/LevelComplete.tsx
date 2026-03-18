import React, { useEffect, useState } from 'react';
import './_group.css';

const StarIcon = ({ filled, delay }: { filled: boolean; delay: number }) => (
  <div
    style={{
      width: '60px',
      height: '60px',
      position: 'relative',
      opacity: 0,
      animation: `starPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delay}s forwards`,
      filter: filled ? 'drop-shadow(0 0 10px var(--gold))' : 'none',
      transform: 'scale(0)',
    }}
  >
    <svg viewBox="0 0 24 24" fill={filled ? 'var(--gold)' : 'transparent'} stroke={filled ? 'var(--gold)' : 'var(--panel-border)'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  </div>
);

const Particle = ({ delay, color, x, y, size, duration }: { delay: number, color: string, x: number, y: number, size: number, duration: number }) => (
  <div
    style={{
      position: 'absolute',
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: color,
      borderRadius: '50%',
      top: '50%',
      left: '50%',
      opacity: 0,
      boxShadow: `0 0 ${size * 2}px ${color}`,
      animation: `particleBurst ${duration}s ease-out ${delay}s forwards`,
      // Custom properties for keyframes
      ['--tx' as any]: `${x}px`,
      ['--ty' as any]: `${y}px`,
    }}
  />
);

export default function LevelComplete() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const styles = `
    @keyframes slideDown {
      0% { transform: translateY(-50px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes titleReveal {
      0% { transform: scale(0.5); opacity: 0; filter: blur(10px); }
      50% { transform: scale(1.1); filter: blur(0px); }
      100% { transform: scale(1); opacity: 1; text-shadow: 0 0 20px var(--accent-glow); }
    }

    @keyframes starPop {
      0% { transform: scale(0) rotate(-45deg); opacity: 0; }
      70% { transform: scale(1.2) rotate(10deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }

    @keyframes slideUpFade {
      0% { transform: translateY(20px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }

    @keyframes fillBar {
      0% { width: 0%; }
      100% { width: var(--target-width); }
    }

    @keyframes particleBurst {
      0% { transform: translate(0, 0) scale(1); opacity: 1; }
      100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
    }

    @keyframes floatConfetti {
      0% { transform: translateY(0) rotate(0deg); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }

    @keyframes pulseGlow {
      0% { box-shadow: 0 0 10px var(--accent-glow), inset 0 0 10px var(--accent-glow); }
      50% { box-shadow: 0 0 25px var(--accent-glow), inset 0 0 15px var(--accent-glow); }
      100% { box-shadow: 0 0 10px var(--accent-glow), inset 0 0 10px var(--accent-glow); }
    }

    .level-complete-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      background: radial-gradient(circle at center, var(--bg) 0%, var(--bg-dark) 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      overflow: hidden;
      padding-top: 40px;
      font-family: var(--font-body);
      color: var(--text);
    }

    .banner {
      position: relative;
      text-align: center;
      animation: slideDown 0.8s ease-out forwards;
      margin-bottom: 20px;
    }

    .banner-subtitle {
      font-family: var(--font-heading);
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 4px;
      font-size: 1.2rem;
      margin-bottom: 5px;
      text-shadow: 0 0 10px var(--primary-glow);
    }

    .banner-title {
      font-family: var(--font-heading);
      color: var(--accent);
      font-size: 4rem;
      font-weight: 900;
      margin: 0;
      letter-spacing: 2px;
      opacity: 0;
      animation: titleReveal 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.3s forwards;
    }

    .stars-container {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      z-index: 10;
    }

    .main-content {
      display: flex;
      gap: 40px;
      max-width: 1000px;
      width: 90%;
      height: 50vh;
      z-index: 10;
      opacity: 0;
      animation: slideUpFade 0.8s ease-out 1.2s forwards;
    }

    .rewards-panel, .info-panel {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      border-radius: 12px;
      padding: 24px;
      flex: 1;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.5);
      position: relative;
      overflow: hidden;
    }
      
    .rewards-panel::before, .info-panel::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent, var(--primary), transparent);
      opacity: 0.5;
    }

    .panel-title {
      font-family: var(--font-heading);
      color: var(--primary);
      font-size: 1.4rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--panel-border);
      padding-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .reward-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px dashed var(--panel-border);
      font-size: 1.2rem;
      opacity: 0;
    }

    .reward-item:last-child {
      border-bottom: none;
    }

    .reward-label {
      color: var(--text-dim);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .reward-value {
      color: var(--text);
      font-family: var(--font-mono);
      font-weight: bold;
    }

    .reward-value.bonus {
      color: var(--accent);
      text-shadow: 0 0 5px var(--accent-glow);
    }

    .reward-value.gold {
      color: var(--gold);
      text-shadow: 0 0 5px var(--gold-glow);
    }

    .progress-section {
      margin-top: auto;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      color: var(--text-dim);
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .progress-bar-bg {
      width: 100%;
      height: 8px;
      background: rgba(0,0,0,0.5);
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid var(--panel-border);
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), var(--gold));
      border-radius: 4px;
      width: 0%;
      box-shadow: 0 0 10px var(--primary-glow);
    }

    .xp-fill {
      background: linear-gradient(90deg, #2255cc, #4488ff);
      box-shadow: 0 0 10px rgba(68, 136, 255, 0.5);
    }

    .next-env-card {
      background: rgba(0,0,0,0.4);
      border: 1px solid var(--panel-border);
      border-radius: 8px;
      padding: 16px;
      margin-top: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
      position: relative;
      overflow: hidden;
    }

    .next-env-card::after {
      content: '';
      position: absolute;
      right: 0; top: 0; bottom: 0; width: 40%;
      background: linear-gradient(90deg, transparent, rgba(68, 204, 136, 0.1));
    }

    .env-icon {
      width: 40px;
      height: 40px;
      background: var(--bg-dark);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent);
      border: 1px solid var(--accent);
      box-shadow: 0 0 10px var(--accent-glow);
    }

    .env-details h4 {
      margin: 0 0 4px 0;
      color: var(--text);
      font-family: var(--font-heading);
    }

    .env-details p {
      margin: 0;
      color: var(--danger);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .actions {
      display: flex;
      gap: 20px;
      margin-top: 40px;
      z-index: 10;
      opacity: 0;
      animation: slideUpFade 0.8s ease-out 1.8s forwards;
    }

    .btn {
      background: var(--panel);
      border: 1px solid var(--panel-border);
      color: var(--text);
      font-family: var(--font-heading);
      font-size: 1.1rem;
      padding: 16px 32px;
      border-radius: 4px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 2px;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn:hover {
      background: rgba(210, 136, 42, 0.2);
      border-color: var(--primary);
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    }

    .btn-primary {
      background: rgba(68, 204, 136, 0.15);
      border-color: var(--accent);
      color: var(--accent);
      animation: pulseGlow 2s infinite;
    }

    .btn-primary:hover {
      background: rgba(68, 204, 136, 0.3);
      color: #fff;
      text-shadow: 0 0 5px var(--accent);
    }
  `;

  // Generate particles
  const particles = Array.from({ length: 40 }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 200;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const size = 3 + Math.random() * 5;
    const duration = 0.8 + Math.random() * 0.5;
    const delay = 0.3 + Math.random() * 0.2;
    const color = Math.random() > 0.5 ? 'var(--accent)' : 'var(--gold)';
    
    return <Particle key={i} delay={delay} color={color} x={x} y={y} size={size} duration={duration} />;
  });

  // Confetti
  const confetti = Array.from({ length: 30 }).map((_, i) => {
    const left = `${Math.random() * 100}vw`;
    const delay = `${Math.random() * 5}s`;
    const duration = `${5 + Math.random() * 5}s`;
    const color = ['var(--primary)', 'var(--accent)', 'var(--gold)', 'var(--danger)'][Math.floor(Math.random() * 4)];
    const size = `${4 + Math.random() * 6}px`;

    return (
      <div
        key={`confetti-${i}`}
        style={{
          position: 'absolute',
          top: '-20px',
          left,
          width: size,
          height: size,
          backgroundColor: color,
          opacity: 0.6,
          animation: `floatConfetti ${duration} linear ${delay} infinite`,
          boxShadow: `0 0 5px ${color}`,
        }}
      />
    );
  });

  return (
    <div className="level-complete-container">
      <style>{styles}</style>
      
      {/* Background Effects */}
      {confetti}
      <div style={{ position: 'absolute', top: '15%', zIndex: 0 }}>
        {particles}
      </div>

      <div className="banner">
        <div className="banner-subtitle">Stage Clear</div>
        <h1 className="banner-title">LEVEL 3 COMPLETE</h1>
      </div>

      <div className="stars-container">
        <StarIcon filled={true} delay={0.8} />
        <StarIcon filled={true} delay={1.0} />
        <StarIcon filled={false} delay={1.2} />
      </div>

      <div className="main-content">
        {/* Left Panel: Rewards */}
        <div className="rewards-panel">
          <div className="panel-title">
            Rewards Received
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          
          <div className="reward-item" style={{ animation: 'slideUpFade 0.4s ease-out 1.4s forwards' }}>
            <span className="reward-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              Base Score
            </span>
            <span className="reward-value">8,450</span>
          </div>
          
          <div className="reward-item" style={{ animation: 'slideUpFade 0.4s ease-out 1.5s forwards' }}>
            <span className="reward-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
              Oranges Collected
            </span>
            <span className="reward-value gold">15 / 20</span>
          </div>

          <div className="reward-item" style={{ animation: 'slideUpFade 0.4s ease-out 1.6s forwards' }}>
            <span className="reward-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M5 22h14M5 2h14M12 6v6l4 2"/></svg>
              Time Bonus (2:45)
            </span>
            <span className="reward-value bonus">+1,200</span>
          </div>

          <div className="reward-item" style={{ animation: 'slideUpFade 0.4s ease-out 1.7s forwards' }}>
            <span className="reward-label">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3"/></svg>
              Perfect Run
            </span>
            <span className="reward-value bonus">+500</span>
          </div>

          <div className="progress-section" style={{ animation: 'slideUpFade 0.4s ease-out 1.8s forwards', marginTop: 'auto' }}>
            <div className="progress-label">
              <span>Total Score</span>
              <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>10,150</span>
            </div>
            <div className="progress-label" style={{ marginTop: '15px' }}>
              <span>Player Level 4</span>
              <span>850 / 1000 XP</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill xp-fill" style={{ '--target-width': '85%' } as any, { animation: mounted ? 'fillBar 1s ease-out 2s forwards' : 'none' }}></div>
            </div>
          </div>
        </div>

        {/* Right Panel: Progression */}
        <div className="info-panel">
          <div className="panel-title">
            Progression
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>

          <div style={{ animation: 'slideUpFade 0.4s ease-out 1.5s forwards' }}>
            <div className="progress-label">
              <span>Overall Campaign</span>
              <span>Level 3 / 5</span>
            </div>
            <div className="progress-bar-bg" style={{ marginBottom: '20px' }}>
              <div className="progress-bar-fill" style={{ '--target-width': '60%' } as any, { animation: mounted ? 'fillBar 1s ease-out 2.2s forwards' : 'none' }}></div>
            </div>
          </div>

          <div style={{ animation: 'slideUpFade 0.4s ease-out 1.6s forwards', marginTop: '20px' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Coming Up Next</div>
            <div className="next-env-card">
              <div className="env-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h20M12 2v20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/></svg>
              </div>
              <div className="env-details">
                <h4>Frozen Caverns</h4>
                <p>High Difficulty • Ice Traps</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="actions">
        <button className="btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Upgrade Shop
        </button>
        <button className="btn btn-primary">
          Continue to Next Level
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}
