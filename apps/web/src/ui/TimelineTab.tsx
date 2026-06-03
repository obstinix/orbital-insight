import React from 'react';

interface HistoricalMission {
  id: string;
  name: string;
  year: number;
  agency: string;
  description: string;
  stats: Record<string, string>;
}

interface TimelineTabProps {
  historicalMissions: HistoricalMission[];
  selectedMissionId: string | null;
  onHistoricalMissionClick: (id: string) => void;
  onLockCamera: (targetName: string) => void;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  historicalMissions,
  selectedMissionId,
  onHistoricalMissionClick,
  onLockCamera,
}) => {
  return (
    <div
      role="tabpanel"
      id="tabpanel-TIMELINE"
      aria-labelledby="tab-TIMELINE"
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
      <span style={sectionHeader}>HISTORICAL MISSIONS ARCHIVE</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {historicalMissions.map((m) => {
          const isSelected = m.id === selectedMissionId;
          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              aria-expanded={isSelected}
              aria-label={`Historical Mission: ${m.name} (${m.year})`}
              style={{
                background: isSelected ? 'rgba(0, 240, 255, 0.08)' : 'rgba(5, 8, 16, 0.3)',
                border: isSelected
                  ? '1px solid rgba(0, 240, 255, 0.4)'
                  : '1px solid rgba(74, 144, 226, 0.12)',
                borderRadius: '4px',
                padding: '0.6rem 0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => onHistoricalMissionClick(m.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onHistoricalMissionClick(m.id);
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>
                  {m.name} ({m.year})
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                  {m.agency}
                </span>
              </div>

              {isSelected && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(74, 144, 226, 0.15)', paddingTop: '6px' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-muted)', margin: 0, lineHeight: '1.3' }}>
                    {m.description}
                  </p>
                  
                  {/* Stats table */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
                    {Object.entries(m.stats).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--color-muted)' }}>{k.toUpperCase()}:</span>
                        <span style={{ color: '#fff' }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Camera Teleport Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (m.id === 'apollo_11') onLockCamera('moon');
                      else if (m.id === 'cassini') onLockCamera('saturn');
                      else if (m.id === 'jwst') onLockCamera('JWST');
                      else if (m.id === 'voyager_1') onLockCamera('voyager_1');
                    }}
                    style={{
                      background: 'rgba(0, 240, 255, 0.1)',
                      border: '1px solid rgba(0, 240, 255, 0.4)',
                      color: '#00f0ff',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '3px',
                      fontSize: '0.65rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-display)',
                      textTransform: 'uppercase',
                      marginTop: '4px',
                      alignSelf: 'flex-start',
                    }}
                  >
                    {m.id === 'voyager_1' ? 'ESCAPE ECLIPTIC VIEW' : `CENTER CAMERA ON ${m.id === 'apollo_11' ? 'MOON' : m.id === 'cassini' ? 'SATURN' : 'OBJECT'}`}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
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
