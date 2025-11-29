import React from 'react';

const WeatherStyles = () => (
  <style>{`
    @keyframes breathe {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    @keyframes rotate-slow {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes float-cloud-slow {
      0% { transform: translateX(-20px); }
      50% { transform: translateX(20px); }
      100% { transform: translateX(-20px); }
    }
    @keyframes float-cloud-fast {
      0% { transform: translateX(-40px) scale(0.9); }
      50% { transform: translateX(40px) scale(1); }
      100% { transform: translateX(-40px) scale(0.9); }
    }
    @keyframes rain-drop-far {
      0% { transform: translateY(-20vh) translateX(10px); }
      100% { transform: translateY(120vh) translateX(-10px); }
    }
    @keyframes rain-drop-near {
      0% { transform: translateY(-20vh) translateX(20px); }
      100% { transform: translateY(120vh) translateX(-20px); }
    }
    @keyframes snow-fall {
      0% { transform: translateY(-20vh) translateX(0) rotate(0deg); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateY(120vh) translateX(var(--sway, 20px)) rotate(360deg); opacity: 0; }
    }
    @keyframes twinkle {
      0%, 100% { opacity: 0.2; transform: scale(0.8); }
      50% { opacity: 0.9; transform: scale(1.2); }
    }
    @keyframes meteor {
      0% { transform: translateX(300%) translateY(-300%) rotate(45deg); opacity: 1; }
      20% { opacity: 1; }
      100% { transform: translateX(-200%) translateY(200%) rotate(45deg); opacity: 0; }
    }
    @keyframes lightning-flash-screen {
      0%, 95%, 100% { opacity: 0; }
      96% { opacity: 0.3; }
      97% { opacity: 0; }
      98% { opacity: 0.6; background-color: rgba(255,255,255,0.8); }
      99% { opacity: 0.2; }
    }
    @keyframes lightning-cloud-glow {
      0%, 90%, 100% { filter: brightness(1); }
      92% { filter: brightness(1.5) drop-shadow(0 0 30px rgba(100,100,255,0.8)); }
      94% { filter: brightness(1.2); }
      96% { filter: brightness(2.5) drop-shadow(0 0 50px rgba(200,200,255,1)); }
    }
    @keyframes sun-ray-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes float-up {
      0% { transform: translateY(100vh) scale(0.8); opacity: 0; }
      10% { opacity: 0.8; }
      90% { opacity: 0.8; }
      100% { transform: translateY(-20vh) scale(1); opacity: 0; }
    }
    @keyframes float-heart {
      0% { transform: translateY(100vh) scale(0.5) rotate(0deg); opacity: 0; }
      10% { opacity: 0.8; }
      50% { transform: translateY(50vh) scale(1) rotate(10deg); }
      100% { transform: translateY(-20vh) scale(0.8) rotate(-10deg); opacity: 0; }
    }
    @keyframes sway {
      0%, 100% { transform: rotate(-5deg); }
      50% { transform: rotate(5deg); }
    }
    @keyframes float-slow {
      0% { transform: translateY(100vh) translateX(0); opacity: 0; }
      20% { opacity: 0.8; }
      80% { opacity: 0.8; }
      100% { transform: translateY(-20vh) translateX(20px); opacity: 0; }
    }
    @keyframes balloon-rise {
      0% { transform: translateY(100vh) scale(0.8); opacity: 0; }
      10% { opacity: 0.9; }
      90% { opacity: 0.9; }
      100% { transform: translateY(-20vh) scale(1); opacity: 0; }
    }
    @keyframes float-ghost {
      0% { transform: translateY(100vh) translateX(-15px) scale(0.8); opacity: 0; }
      20% { opacity: 0.7; }
      50% { transform: translateY(50vh) translateX(15px) scale(1); }
      100% { transform: translateY(-20vh) translateX(-15px) scale(0.9); opacity: 0; }
    }
    .pro-gradient-layer {
      position: absolute;
      inset: 0;
      transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .particle-container {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .will-change-transform {
      will-change: transform;
    }
    .glass-panel {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    }
  `}</style>
);

export default WeatherStyles;
