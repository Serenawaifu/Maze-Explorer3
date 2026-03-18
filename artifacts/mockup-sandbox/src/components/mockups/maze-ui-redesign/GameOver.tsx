import React, { useEffect, useState } from 'react';
import './_group.css';

const GameOver: React.FC = () => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate random background particles
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
    }));
    setParticles(newParticles);
  }, []);

  const styles = `
    .game-over-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #050202;
      overflow: hidden;
      color: var(--text);
    }
    
    .vignette {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at center, transparent 0%, rgba(10, 0, 0, 0.9) 100%);
      pointer-events: none;
      z-index: 2;
    }

    .shattered-glass {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 10;
      opacity: 0.15;
      mix-blend-mode: screen;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cpath d='M0,0 L100,150 L20,300 L300,450 L100,700 L500,600 L800,900 L950,500 L800,200 L1000,0 Z' stroke='%23ffffff' stroke-width='1' fill='none' opacity='0.5'/%3E%3Cpath d='M300,450 L500,200 L800,200' stroke='%23ffffff' stroke-width='0.5' fill='none' opacity='0.3'/%3E%3Cpath d='M20,300 L0,500' stroke='%23ffffff' stroke-width='0.5' fill='none' opacity='0.3'/%3E%3Cpath d='M500,600 L1000,500' stroke='%23ffffff' stroke-width='0.5' fill='none' opacity='0.3'/%3E%3C/svg%3E");
      background-size: cover;
    }

    .particle {
      position: absolute;
      background: #ff3333;
      border-radius: 50%;
      pointer-events: none;
      box-shadow: 0 0 10px 2px rgba(255, 50, 50, 0.8);
      z-index: 1;
      animation: floatUp linear infinite;
    }

    @keyframes floatUp {
      0% { transform: translateY(100vh) scale(0); opacity: 0; }
      10% { opacity: 0.8; }
      90% { opacity: 0.8; }
      100% { transform: translateY(-10vh) scale(1); opacity: 0; }
    }

    .content-layer {
      z-index: 20;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 800px;
      width: 100%;
      padding: 2rem;
    }

    .skull-icon {
      width: 80px;
      height: 80px;
      margin-bottom: 1rem;
      filter: drop-shadow(0 0 15px rgba(204, 34, 51, 0.8));
      animation: pulseSkull 2s ease-in-out infinite alternate;
    }

    @keyframes pulseSkull {
      0% { filter: drop-shadow(0 0 10px rgba(204, 34, 51, 0.5)); transform: scale(0.95); }
      100% { filter: drop-shadow(0 0 25px rgba(204, 34, 51, 1)); transform: scale(1.05); }
    }

    .subtitle {
      font-family: var(--font-heading);
      font-size: 1.2rem;
      letter-spacing: 0.3em;
      color: var(--danger);
      margin-bottom: -10px;
      opacity: 0.8;
      text-transform: uppercase;
    }

    .title-glitch {
      font-family: var(--font-heading);
      font-size: 5rem;
      font-weight: 900;
      color: #ff2233;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 0;
      position: relative;
      text-shadow: 0 0 20px rgba(204, 34, 51, 0.8), 0 0 40px rgba(204, 34, 51, 0.4);
      animation: mainGlitch 3s infinite;
    }

    .title-glitch::before, .title-glitch::after {
      content: 'GAME OVER';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.8;
    }

    .title-glitch::before {
      color: #0ff;
      z-index: -1;
      animation: glitchAnim 2s infinite linear alternate-reverse;
    }

    .title-glitch::after {
      color: #ff00ff;
      z-index: -2;
      animation: glitchAnim2 3s infinite linear alternate-reverse;
    }

    @keyframes mainGlitch {
      0%, 100% { transform: translate(0); opacity: 1; }
      20% { opacity: 1; }
      21% { opacity: 0.5; transform: translate(-2px, 1px); }
      22% { opacity: 1; transform: translate(0); }
      40% { opacity: 1; }
      41% { opacity: 0; transform: translate(2px, -1px); }
      42% { opacity: 1; transform: translate(0); }
      80% { opacity: 1; }
      81% { opacity: 0.8; transform: skewX(10deg); }
      82% { opacity: 1; transform: skewX(0); }
    }

    @keyframes glitchAnim {
      0% { clip-path: inset(10% 0 80% 0); transform: translate(-2px, 2px); }
      20% { clip-path: inset(80% 0 5% 0); transform: translate(2px, -2px); }
      40% { clip-path: inset(40% 0 40% 0); transform: translate(-2px, 2px); }
      60% { clip-path: inset(20% 0 60% 0); transform: translate(2px, -2px); }
      80% { clip-path: inset(60% 0 20% 0); transform: translate(-2px, 2px); }
      100% { clip-path: inset(10% 0 80% 0); transform: translate(2px, -2px); }
    }

    @keyframes glitchAnim2 {
      0% { clip-path: inset(20% 0 60% 0); transform: translate(2px, -2px); }
      20% { clip-path: inset(60% 0 20% 0); transform: translate(-2px, 2px); }
      40% { clip-path: inset(10% 0 80% 0); transform: translate(2px, -2px); }
      60% { clip-path: inset(80% 0 5% 0); transform: translate(-2px, 2px); }
      80% { clip-path: inset(40% 0 40% 0); transform: translate(2px, -2px); }
      100% { clip-path: inset(20% 0 60% 0); transform: translate(-2px, 2px); }
    }

    .death-recap {
      background: linear-gradient(90deg, transparent, rgba(204, 34, 51, 0.15), transparent);
      border-top: 1px solid rgba(204, 34, 51, 0.3);
      border-bottom: 1px solid rgba(204, 34, 51, 0.3);
      padding: 0.75rem 2rem;
      margin: 2rem 0;
      text-align: center;
      width: 100%;
    }

    .death-recap p {
      margin: 0;
      font-size: 1.1rem;
      color: #ff9999;
      letter-spacing: 0.05em;
    }

    .death-recap strong {
      color: #ff3333;
      font-weight: 700;
    }

    .stats-panel {
      background: var(--panel);
      border: 1px solid rgba(210, 140, 60, 0.15);
      border-radius: 8px;
      padding: 1.5rem;
      width: 100%;
      max-width: 600px;
      position: relative;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.8);
    }

    .new-best-badge {
      position: absolute;
      top: -12px;
      right: -12px;
      background: var(--gold);
      color: #000;
      font-family: var(--font-heading);
      font-weight: 800;
      font-size: 0.75rem;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      transform: rotate(5deg);
      box-shadow: 0 0 15px var(--gold-glow);
      animation: bestGlow 1.5s infinite alternate;
      z-index: 5;
    }

    @keyframes bestGlow {
      from { box-shadow: 0 0 10px var(--gold-glow), 0 0 20px var(--gold-glow); }
      to { box-shadow: 0 0 20px var(--gold-glow), 0 0 40px #ffcc00; }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(0,0,0,0.4);
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.05);
    }

    .stat-label {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-family: var(--font-mono);
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--primary);
      text-shadow: 0 0 10px var(--primary-glow);
    }

    .stat-value.score {
      font-size: 2.2rem;
      color: var(--gold);
      text-shadow: 0 0 15px var(--gold-glow);
    }

    .difficulty-badge {
      font-size: 0.9rem;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .difficulty-hard {
      background: rgba(255, 136, 0, 0.2);
      color: #ff8800;
      border: 1px solid #ff8800;
      box-shadow: 0 0 10px rgba(255, 136, 0, 0.3);
    }

    .button-container {
      display: flex;
      gap: 1rem;
      margin-top: 3rem;
    }

    .btn {
      font-family: var(--font-heading);
      font-size: 1.1rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 1rem 2rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 700;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .btn::before {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: all 0.5s ease;
    }

    .btn:hover::before {
      left: 100%;
    }

    .btn-primary {
      background: linear-gradient(135deg, #cc2233 0%, #880011 100%);
      color: white;
      box-shadow: 0 0 20px rgba(204, 34, 51, 0.5);
      border: 1px solid #ff5566;
    }

    .btn-primary:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 0 30px rgba(204, 34, 51, 0.8);
      background: linear-gradient(135deg, #ee3344 0%, #aa0022 100%);
    }

    .btn-secondary {
      background: transparent;
      color: var(--text-dim);
      border: 1px solid rgba(220, 200, 170, 0.3);
    }

    .btn-secondary:hover {
      background: rgba(255,255,255,0.05);
      color: var(--text);
      border-color: var(--text-dim);
    }
  `;

  return (
    <div className="game-over-container">
      <style>{styles}</style>
      
      {/* Background Effects */}
      <div className="vignette"></div>
      <div className="shattered-glass"></div>
      
      {/* Particles */}
      {particles.map(p => (
        <div 
          key={p.id} 
          className="particle" 
          style={{
            left: `${p.x}vw`,
            bottom: `-20px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`
          }}
        />
      ))}

      <div className="content-layer">
        {/* Skull Icon */}
        <svg className="skull-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 10C30 10 15 25 15 45C15 58 22 69 32 75V90H68V75C78 69 85 58 85 45C85 25 70 10 50 10Z" fill="#111" stroke="#cc2233" strokeWidth="3"/>
          <circle cx="35" cy="45" r="8" fill="#cc2233"/>
          <circle cx="65" cy="45" r="8" fill="#cc2233"/>
          <path d="M45 60L50 55L55 60" stroke="#cc2233" strokeWidth="2" strokeLinecap="round"/>
          <line x1="40" y1="80" x2="40" y2="90" stroke="#cc2233" strokeWidth="2"/>
          <line x1="50" y1="80" x2="50" y2="90" stroke="#cc2233" strokeWidth="2"/>
          <line x1="60" y1="80" x2="60" y2="90" stroke="#cc2233" strokeWidth="2"/>
        </svg>

        <div className="subtitle">Mission Failed</div>
        <h1 className="title-glitch">GAME OVER</h1>

        <div className="death-recap">
          <p>Eliminated by <strong>Shadow Wraith</strong> on Level 3</p>
        </div>

        <div className="stats-panel">
          <div className="new-best-badge">NEW PERSONAL BEST!</div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Final Score</span>
              <span className="stat-value score">8,450</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Level Reached</span>
              <span className="stat-value">3</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Oranges Collected</span>
              <span className="stat-value" style={{ color: '#ffa500' }}>+12</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Global Rank</span>
              <span className="stat-value" style={{ color: '#44cc88' }}>#3</span>
            </div>
            <div className="stat-item" style={{ gridColumn: 'span 2' }}>
              <span className="stat-label">Difficulty</span>
              <span className="difficulty-badge difficulty-hard">Hard</span>
            </div>
          </div>
        </div>

        <div className="button-container">
          <button className="btn btn-primary" onClick={() => console.log('Try Again')}>
            Try Again
          </button>
          <button className="btn btn-secondary" onClick={() => console.log('Upgrade Shop')}>
            Upgrade Shop
          </button>
          <button className="btn btn-secondary" onClick={() => console.log('Menu')}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
