import React from 'react';

interface TelemetryTabProps {
  activeSpacecraft: 'ISS' | 'JWST' | 'HUBBLE';
  setActiveSpacecraft: (craft: 'ISS' | 'JWST' | 'HUBBLE') => void;
  issTelemetry: {
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    timestamp: number;
    isSimulated?: boolean;
  };
  telemetryPollError: boolean;
  onLockCamera: (targetName: string) => void;
}

export const TelemetryTab: React.FC<TelemetryTabProps> = ({
  activeSpacecraft,
  setActiveSpacecraft,
  issTelemetry,
  telemetryPollError,
  onLockCamera,
}) => {
  return (
    <div
      role="tabpanel"
      id="tabpanel-TELEMETRY"
      aria-labelledby="tab-TELEMETRY"
      tabIndex={0}
      style={{
        background: 'rgba(10, 14, 42, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(74, 144, 226, 0.15)',
        padding: '1.2rem',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Spacecraft Toggle */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveSpacecraft('ISS')}
          aria-pressed={activeSpacecraft === 'ISS'}
          style={{
            flex: 1,
            background: activeSpacecraft === 'ISS' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(5, 8, 16, 0.4)',
            border: activeSpacecraft === 'ISS' ? '1px solid #00f0ff' : '1px solid rgba(74, 144, 226, 0.15)',
            color: activeSpacecraft === 'ISS' ? '#00f0ff' : 'var(--color-muted)',
            padding: '0.4rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
          }}
        >
          ISS
        </button>
        <button
          onClick={() => setActiveSpacecraft('HUBBLE')}
          aria-pressed={activeSpacecraft === 'HUBBLE'}
          style={{
            flex: 1,
            background: activeSpacecraft === 'HUBBLE' ? 'rgba(155, 89, 182, 0.1)' : 'rgba(5, 8, 16, 0.4)',
            border: activeSpacecraft === 'HUBBLE' ? '1px solid #9b59b6' : '1px solid rgba(74, 144, 226, 0.15)',
            color: activeSpacecraft === 'HUBBLE' ? '#9b59b6' : 'var(--color-muted)',
            padding: '0.4rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
          }}
        >
          HUBBLE
        </button>
        <button
          onClick={() => setActiveSpacecraft('JWST')}
          aria-pressed={activeSpacecraft === 'JWST'}
          style={{
            flex: 1,
            background: activeSpacecraft === 'JWST' ? 'rgba(255, 170, 0, 0.1)' : 'rgba(5, 8, 16, 0.4)',
            border: activeSpacecraft === 'JWST' ? '1px solid #ffaa00' : '1px solid rgba(74, 144, 226, 0.15)',
            color: activeSpacecraft === 'JWST' ? '#ffaa00' : 'var(--color-muted)',
            padding: '0.4rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-display)',
          }}
        >
          JWST
        </button>
      </div>

      {/* Telemetry Display */}
      {activeSpacecraft === 'ISS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: telemetryPollError ? '#ff3333' : '#00ffff',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            {issTelemetry.isSimulated
              ? '⚠️ SIGNAL LOSS: KEPLER SIM ACTIVE'
              : '🛰️ LIVE ISS NETWORK ONLINE'}
          </div>
          <div style={telemetryRow}>
            <span style={telemetryLabel}>LATITUDE:</span>
            <span style={telemetryVal}>{issTelemetry.latitude.toFixed(5)}°</span>
          </div>
          <div style={telemetryRow}>
            <span style={telemetryLabel}>LONGITUDE:</span>
            <span style={telemetryVal}>{issTelemetry.longitude.toFixed(5)}°</span>
          </div>
          <div style={telemetryRow}>
            <span style={telemetryLabel}>ALTITUDE:</span>
            <span style={telemetryVal}>{issTelemetry.altitude.toFixed(1)} km</span>
          </div>
          <div style={telemetryRow}>
            <span style={telemetryLabel}>ORBIT SPEED:</span>
            <span style={telemetryVal}>{issTelemetry.speed.toLocaleString()} km/h</span>
          </div>

          <button
            onClick={() => onLockCamera('ISS')}
            style={lockBtnStyle('#00f0ff')}
          >
            LOCK CAMERA ON ISS
          </button>
        </div>
      )}

      {activeSpacecraft === 'HUBBLE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: '#9b59b6',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            🔭 SPACE TELESCOPE TARGET RESOLVED
          </div>
          <div style={telemetryRow}>
            <span style={telemetryLabel}>LATITUDE:</span>
            <span style={telemetryVal}>{issTelemetry.latitude.toFixed(5)}°</span>
          </div>
          <div style={telemetryRow}>
            <span style={telemetryLabel}>LONGITUDE:</span>
            <span style={telemetryVal}>{issTelemetry.longitude.toFixed(5)}°</span>
          </div>
          <div style={telemetryRow}>
            <span style={telemetryLabel}>ALTITUDE:</span>
            <span style={telemetryVal}>540.0 km</span>
          </div>
          <div style={telemetryRow}>
            <span style={telemetryLabel}>ORBIT SPEED:</span>
            <span style={telemetryVal}>27,300 km/h</span>
          </div>

          <button
            onClick={() => onLockCamera('HUBBLE')}
            style={lockBtnStyle('#9b59b6')}
          >
            LOCK CAMERA ON HUBBLE
          </button>
        </div>
      )}

      {activeSpacecraft === 'JWST' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: '#ffaa00',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            🔭 DEEP INFRARED SKY OBSERVED
          </div>
          <div style={telemetryRow}>
            <span style={telemetryLabel}>ORBIT LOCATION:</span>
            <span style={telemetryVal}>Earth-Sun L2</span>
          </div>
          <div style={telemetryRow}>
            <span style={telemetryLabel}>DISTANCE:</span>
            <span style={telemetryVal}>1,500,000 km</span>
          </div>
          <div style={telemetryRow}>
            <span style={telemetryLabel}>SHIELD TEMP:</span>
            <span style={telemetryVal}>-233°C (40K)</span>
          </div>
          <div style={telemetryRow}>
            <span style={telemetryLabel}>INSTRUMENTS:</span>
            <span style={{ ...telemetryVal, color: '#33ff33' }}>OK / OPERATIONAL</span>
          </div>

          <button
            onClick={() => onLockCamera('JWST')}
            style={lockBtnStyle('#ffaa00')}
          >
            LOCK CAMERA ON JWST
          </button>
        </div>
      )}
    </div>
  );
};

// Reusable CSS styles
const telemetryRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.75rem',
  borderBottom: '1px solid rgba(74, 144, 226, 0.08)',
  paddingBottom: '4px',
};

const telemetryLabel: React.CSSProperties = {
  color: 'var(--color-muted)',
};

const telemetryVal: React.CSSProperties = {
  color: 'var(--color-starlight)',
};

const lockBtnStyle = (color: string): React.CSSProperties => ({
  background: `rgba(${color === '#ffaa00' ? '255, 170, 0' : color === '#9b59b6' ? '155, 89, 182' : '0, 240, 255'}, 0.1)`,
  border: `1px solid ${color}`,
  color: color,
  padding: '0.4rem 0.8rem',
  borderRadius: '4px',
  fontSize: '0.75rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  textTransform: 'uppercase',
  transition: 'all 0.15s ease',
  marginTop: '8px',
});
