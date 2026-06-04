import React from 'react';

export const Attribution: React.FC = () => {
  return (
    <footer
      style={{
        position: 'absolute',
        bottom: '8px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-hud)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6rem',
        color: 'rgba(107, 127, 163, 0.4)',
        letterSpacing: '1px',
        textAlign: 'center',
        pointerEvents: 'none',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
      }}
    >
      Astronomical data: NASA JPL • Textures: Solar System Scope (CC BY 4.0) •
      Star catalog: HYG Database v41 (CC BY-SA 2.5) • Constellation data: d3-celestial (BSD)
    </footer>
  );
};
export default Attribution;
