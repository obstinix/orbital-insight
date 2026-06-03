import React, { useEffect, useRef } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'WARNING: CRITICAL OPERATION',
  message,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  onConfirm,
  onCancel,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  // Close on Escape, Trap focus on Cancel button initially
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    cancelBtnRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-desc"
        style={{
          width: '360px',
          background: 'linear-gradient(135deg, #0f0a0a 0%, #050202 100%)',
          border: '1.5px solid #ff3b30',
          boxShadow: '0 0 30px rgba(255, 59, 48, 0.25)',
          padding: '2rem 1.5rem',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          animation: 'fadeIn var(--duration-medium) ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div
          style={{
            fontSize: '2rem',
            color: '#ff3b30',
            textShadow: '0 0 10px rgba(255, 59, 48, 0.4)',
          }}
        >
          ⚠️
        </div>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2
            id="confirm-modal-title"
            style={{
              fontSize: '1rem',
              color: '#ff3b30',
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '1.5px',
              fontWeight: 'bold',
              margin: 0,
            }}
          >
            {title}
          </h2>
          <p
            id="confirm-modal-desc"
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-muted, #8b9bb4)',
              lineHeight: '1.5',
              margin: '8px 0 0 0',
            }}
          >
            {message}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px' }}>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              background: 'rgba(255, 59, 48, 0.12)',
              border: '1px solid #ff3b30',
              color: '#ff3b30',
              padding: '0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'var(--font-display, sans-serif)',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              transition: 'all 0.15s ease',
            }}
          >
            {confirmLabel}
          </button>
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            style={{
              flex: 1,
              background: 'rgba(5, 8, 16, 0.6)',
              border: '1px solid rgba(74, 144, 226, 0.2)',
              color: 'var(--color-starlight, #fff)',
              padding: '0.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'var(--font-display, sans-serif)',
              fontSize: '0.75rem',
              letterSpacing: '1px',
              transition: 'all 0.15s ease',
            }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
