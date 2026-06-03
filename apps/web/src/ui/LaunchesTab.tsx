import React from 'react';

interface Launch {
  id: string;
  name: string;
  agency: string;
  rocket: string;
  site: string;
  date: string;
  description: string;
}

interface LaunchesTabProps {
  launches: Launch[];
  countdowns: Record<string, string>;
}

export const LaunchesTab: React.FC<LaunchesTabProps> = ({ launches, countdowns }) => {
  return (
    <div
      role="tabpanel"
      id="tabpanel-LAUNCHES"
      aria-labelledby="tab-LAUNCHES"
      tabIndex={0}
      style={{
        background: 'rgba(10, 14, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(74, 144, 226, 0.15)',
        padding: '1rem',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflowY: 'auto',
      }}
    >
      <span style={sectionHeader}>UPCOMING FLIGHT DEPARTURES</span>
      {launches.map((launch) => (
        <div
          key={launch.id}
          style={{
            background: 'rgba(5, 8, 16, 0.4)',
            border: '1px solid rgba(74, 144, 226, 0.12)',
            borderRadius: '4px',
            padding: '0.6rem 0.8rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>
              {launch.name}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-teal-cyan)', fontFamily: 'var(--font-mono)' }}>
              {launch.agency}
            </span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>
            {launch.rocket} • {launch.site}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--color-muted)', margin: '4px 0', lineHeight: '1.3' }}>
            {launch.description}
          </p>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#00ffff',
              background: 'rgba(0, 240, 255, 0.05)',
              padding: '4px 8px',
              borderRadius: '3px',
              textAlign: 'center',
              marginTop: '4px',
              letterSpacing: '1px',
            }}
          >
            T-MINUS: {countdowns[launch.id] || 'CALCULATING...'}
          </div>
        </div>
      ))}
    </div>
  );
};

const sectionHeader: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  color: 'var(--color-muted)',
  letterSpacing: '1px',
  marginBottom: '4px',
};
