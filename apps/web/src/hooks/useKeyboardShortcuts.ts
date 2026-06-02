import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAudioStore } from '../store/useAudioStore';
import { useConstellationStore } from '../store/useConstellationStore';
import { useTimeStore } from '../store/useTimeStore';

/**
 * Global keyboard shortcuts for the Orbital Insight platform.
 *
 * Returns `{ isShortcutsPanelOpen, setShortcutsPanelOpen }` so the
 * shortcuts modal can be controlled from the hook consumer.
 */
export function useKeyboardShortcuts() {
  const [isShortcutsPanelOpen, setShortcutsPanelOpen] = useState(false);
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input field
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Don't intercept if modifiers are held (Cmd/Ctrl)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        // ── HELP ──
        case '?':
          e.preventDefault();
          setShortcutsPanelOpen((prev) => !prev);
          break;

        // ── DISMISS OVERLAYS ──
        case 'Escape':
          if (isShortcutsPanelOpen) {
            e.preventDefault();
            setShortcutsPanelOpen(false);
          }
          break;

        // ── ROUTE NAVIGATION ── (number keys 1-6)
        case '1':
          e.preventDefault();
          navigate('/');
          break;
        case '2':
          e.preventDefault();
          navigate('/journey');
          break;
        case '3':
          e.preventDefault();
          navigate('/constellations');
          break;
        case '4':
          e.preventDefault();
          navigate('/exoplanets');
          break;
        case '5':
          e.preventDefault();
          navigate('/missions');
          break;
        case '6':
          e.preventDefault();
          navigate('/achievements');
          break;

        // ── AUDIO ──
        case 'm':
        case 'M':
          e.preventDefault();
          useAudioStore.getState().toggleMute();
          break;

        // ── CONSTELLATION TOGGLE ──
        case 'c':
        case 'C':
          e.preventDefault();
          useConstellationStore.getState().toggleConstellations();
          break;

        // ── TIME CONTROLS ──
        case ' ': // Space: play/pause
          e.preventDefault();
          useTimeStore.getState().togglePause();
          break;
        case ']': // Speed up
          e.preventDefault();
          useTimeStore.getState().speedUp();
          break;
        case '[': // Slow down
          e.preventDefault();
          useTimeStore.getState().slowDown();
          break;
        case 'r':
        case 'R': // Reset time to now
          e.preventDefault();
          useTimeStore.getState().resetToNow();
          break;

        default:
          break;
      }
    },
    [navigate, isShortcutsPanelOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return { isShortcutsPanelOpen, setShortcutsPanelOpen };
}
