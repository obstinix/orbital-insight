import React, { useEffect, useRef } from 'react';

interface ShortcutEntry {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  icon: string;
  shortcuts: ShortcutEntry[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'NAVIGATION',
    icon: '🧭',
    shortcuts: [
      { keys: ['1'], description: 'Solar System' },
      { keys: ['2'], description: 'Journey Mode' },
      { keys: ['3'], description: 'Constellation Mapper' },
      { keys: ['4'], description: 'Exoplanet Catalog' },
      { keys: ['5'], description: 'Mission Tracker' },
      { keys: ['6'], description: 'Mission Log' },
    ],
  },
  {
    title: 'TIME CONTROL',
    icon: '⏱',
    shortcuts: [
      { keys: ['Space'], description: 'Play / Pause simulation' },
      { keys: [']'], description: 'Speed up time warp' },
      { keys: ['['], description: 'Slow down time warp' },
      { keys: ['R'], description: 'Reset to current date' },
    ],
  },
  {
    title: 'DISPLAY',
    icon: '🔭',
    shortcuts: [
      { keys: ['C'], description: 'Toggle constellation lines' },
      { keys: ['Esc'], description: 'Deselect / close overlay' },
    ],
  },
  {
    title: 'AUDIO',
    icon: '🔊',
    shortcuts: [
      { keys: ['M'], description: 'Mute / Unmute audio' },
    ],
  },
  {
    title: 'SYSTEM',
    icon: '⚙',
    shortcuts: [
      { keys: ['?'], description: 'Toggle this shortcuts panel' },
    ],
  },
];

// ── KEYCAP VISUAL ─────────────────────────────────────────────
const Keycap: React.FC<{ label: string }> = ({ label }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: label.length > 3 ? '64px' : '32px',
      height: '28px',
      padding: '0 8px',
      borderRadius: '6px',
      background: 'linear-gradient(180deg, rgba(74, 144, 226, 0.15) 0%, rgba(74, 144, 226, 0.05) 100%)',
      border: '1px solid rgba(74, 144, 226, 0.35)',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.7rem',
      fontWeight: 600,
      color: 'var(--color-teal-cyan)',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      textShadow: '0 0 6px rgba(0, 188, 212, 0.4)',
      userSelect: 'none',
    }}
  >
    {label}
  </span>
);

// ── SHORTCUTS MODAL ───────────────────────────────────────────
interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap: focus the panel when it opens
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key and click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 8, 16, 0.7)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn var(--duration-medium) var(--ease-warp) both',
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts reference"
        tabIndex={-1}
        style={{
          width: '620px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          background: 'rgba(10, 14, 42, 0.92)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(74, 144, 226, 0.2)',
          borderRadius: '12px',
          boxShadow: '0 16px 64px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 188, 212, 0.08)',
          padding: '1.5rem',
          animation: 'scaleIn var(--duration-medium) var(--ease-orbit) both',
          outline: 'none',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(74, 144, 226, 0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>⌨</span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.9rem',
                color: 'var(--color-teal-cyan)',
                letterSpacing: '3px',
                margin: 0,
                textShadow: '0 0 10px rgba(0, 188, 212, 0.4)',
              }}
            >
              KEYBOARD SHORTCUTS
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close keyboard shortcuts panel"
            style={{
              background: 'rgba(74, 144, 226, 0.1)',
              border: '1px solid rgba(74, 144, 226, 0.2)',
              color: 'var(--color-muted)',
              borderRadius: '6px',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
              transition: 'all var(--duration-fast) var(--ease-warp)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Shortcut Groups Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              {/* Group header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '0.6rem',
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>{group.icon}</span>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.6rem',
                    color: 'var(--color-stellar-blue)',
                    letterSpacing: '2px',
                    margin: 0,
                  }}
                >
                  {group.title}
                </h3>
              </div>

              {/* Shortcut rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      background: 'rgba(74, 144, 226, 0.04)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.8rem',
                        color: 'var(--color-starlight)',
                        opacity: 0.85,
                      }}
                    >
                      {shortcut.description}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {shortcut.keys.map((key) => (
                        <Keycap key={key} label={key} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(74, 144, 226, 0.12)',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--color-muted)',
            letterSpacing: '1px',
          }}
        >
          Press <Keycap label="?" /> to toggle this panel
        </div>
      </div>
    </div>
  );
};
