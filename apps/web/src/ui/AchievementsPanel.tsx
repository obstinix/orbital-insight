import React, { useState, useEffect } from 'react';
import { useAchievementStore } from '../store/useAchievementStore';
import { useAccountStore } from '../store/useAccountStore';
import { ConfirmModal } from './ConfirmModal';

const AVATAR_OPTIONS = ['🚀', '👨‍🚀', '👽', '🪐', '🛰️', '🛸', '☄️', '🌌', '🔭'];

export const AchievementsPanel: React.FC = () => {
  const { achievements, resetAchievements } = useAchievementStore();
  const { profile, updateProfile, resetAccount } = useAccountStore();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempUsername, setTempUsername] = useState(profile.username);
  const [tempAvatar, setTempAvatar] = useState(profile.avatar);

  // Share Card Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Focus and close share modal via keyboard
  useEffect(() => {
    if (!showShareModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowShareModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showShareModal]);

  const unlockedCount = achievements.filter((a) => a.unlockedAt !== null).length;
  const totalCount = achievements.length;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // XP progress bar math (level increases every 100 XP)
  const currentXpInLevel = profile.xp % 100;
  const nextLevelXpThreshold = 100;
  const xpProgressPercentage = (currentXpInLevel / nextLevelXpThreshold) * 100;

  const handleSaveProfile = () => {
    updateProfile(tempUsername, tempAvatar);
    setIsEditingProfile(false);
  };

  const handleResetAll = () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    resetAchievements();
    resetAccount();
    setTempUsername('Explorer One');
    setTempAvatar('🚀');
    setIsConfirmOpen(false);
  };

  const handleShareLog = () => {
    setShowShareModal(true);
    setShareSuccess(false);
    
    // Simulate link copy to clipboard
    try {
      const mockLink = `https://orbital-insight.com/explorer/${profile.username.replace(/\s+/g, '-').toLowerCase()}`;
      navigator.clipboard.writeText(mockLink);
    } catch (e) {
      // clipboard unsupported in Sandbox
    }
  };

  return (
    <div
      role="region"
      aria-label="Explorer Mission Log HUD"
      style={{
        position: 'absolute',
        top: 'var(--space-2)',
        right: 'var(--space-2)',
        width: '360px',
        maxHeight: 'calc(100vh - 100px)',
        zIndex: 'var(--z-panel)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        overflow: 'hidden',
        animation: 'slideIn var(--duration-medium) var(--ease-warp) both',
      }}
    >
      {/* Profile Log Card */}
      <div
        style={{
          background: 'rgba(10, 14, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid var(--color-cosmic-gold)',
          padding: '1.2rem',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(245, 166, 35, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--color-cosmic-gold)',
            letterSpacing: '1.5px',
          }}
        >
          COSMIC EXPLORER BADGE
        </span>

        {/* Profile Details Edit mode or View mode */}
        {isEditingProfile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '2rem' }}>{tempAvatar}</span>
              <input
                type="text"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                maxLength={18}
                aria-label="Edit explorer username"
                style={{
                  flex: 1,
                  background: 'rgba(5, 8, 16, 0.8)',
                  border: '1px solid var(--color-cosmic-gold)',
                  color: '#fff',
                  borderRadius: '4px',
                  padding: '0.3rem 0.6rem',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
            {/* Avatar Select list */}
            <div 
              aria-label="Select avatar badge"
              style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '4px 0' }}
            >
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  onClick={() => setTempAvatar(av)}
                  aria-label={`Select avatar ${av}`}
                  aria-pressed={tempAvatar === av}
                  style={{
                    background: tempAvatar === av ? 'rgba(245, 166, 35, 0.2)' : 'rgba(5, 8, 16, 0.4)',
                    border: tempAvatar === av ? '1px solid var(--color-cosmic-gold)' : '1px solid rgba(74, 144, 226, 0.15)',
                    fontSize: '1.2rem',
                    padding: '4px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {av}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleSaveProfile} style={actionBtn(true)}>
                SAVE DETAILS
              </button>
              <button onClick={() => setIsEditingProfile(false)} style={actionBtn(false)}>
                CANCEL
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                background: 'rgba(5, 8, 16, 0.6)',
                border: '1px solid rgba(245, 166, 35, 0.3)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '2.5rem',
                flexShrink: 0,
              }}
            >
              {profile.avatar}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem', color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>
                  {profile.username}
                </span>
                <button
                  onClick={() => {
                    setTempUsername(profile.username);
                    setTempAvatar(profile.avatar);
                    setIsEditingProfile(true);
                  }}
                  aria-label="Edit explorer profile name and avatar"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-cosmic-gold)',
                    fontSize: '0.65rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    textDecoration: 'underline',
                  }}
                >
                  EDIT
                </button>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--color-teal-cyan)',
                  letterSpacing: '0.5px',
                }}
              >
                RANK: {profile.rank}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>
                ENLISTED: {profile.joinDate}
              </span>
            </div>
          </div>
        )}

        {/* Level and XP meters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(245, 166, 35, 0.15)', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
            <span>LEVEL {profile.level}</span>
            <span style={{ color: 'var(--color-muted)' }}>
              {profile.xp} / {profile.level * 100} XP TOTAL
            </span>
          </div>
          {/* Progress Bar Container */}
          <div style={{ width: '100%', height: '6px', background: 'rgba(5, 8, 16, 0.6)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(245, 166, 35, 0.15)' }}>
            <div
              style={{
                width: `${xpProgressPercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--color-cosmic-gold), #fff)',
                boxShadow: '0 0 8px var(--color-cosmic-gold)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Level Stats Rows */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(245, 166, 35, 0.15)', paddingTop: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
          <div style={statBox}>
            <span style={{ color: 'var(--color-muted)' }}>COMPLETED</span>
            <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 'bold' }}>
              {completionPercentage}%
            </span>
          </div>
          <div style={statBox}>
            <span style={{ color: 'var(--color-muted)' }}>BADGES</span>
            <span style={{ color: 'var(--color-cosmic-gold)', fontSize: '1rem', fontWeight: 'bold' }}>
              {unlockedCount} / {totalCount}
            </span>
          </div>
        </div>

        <button onClick={handleShareLog} aria-label="Export and share mission log" style={shareBtnStyle}>
          🚀 EXPORT MISSION LOG
        </button>
      </div>

      {/* Badges Grid Panel */}
      <div
        style={{
          background: 'rgba(10, 14, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(74, 144, 226, 0.15)',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--color-muted)',
            letterSpacing: '1.5px',
            marginBottom: '4px',
          }}
        >
          EARNED DECORATIONS
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {achievements.map((a) => {
            const isUnlocked = a.unlockedAt !== null;
            return (
              <div
                key={a.id}
                style={{
                  background: isUnlocked ? 'rgba(245, 166, 35, 0.05)' : 'rgba(5, 8, 16, 0.25)',
                  border: isUnlocked
                    ? '1px solid rgba(245, 166, 35, 0.3)'
                    : '1px solid rgba(74, 144, 226, 0.08)',
                  borderRadius: '4px',
                  padding: '0.6rem 0.8rem',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  filter: isUnlocked ? 'none' : 'grayscale(100%) opacity(50%)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    fontSize: '1.6rem',
                    width: '38px',
                    height: '38px',
                    background: 'rgba(5, 8, 16, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {isUnlocked ? a.icon : '🔒'}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: isUnlocked ? '#fff' : 'var(--color-muted)', fontWeight: 'bold' }}>
                      {a.title}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: isUnlocked ? 'var(--color-cosmic-gold)' : 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
                      +{a.xpAward} XP
                    </span>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', lineHeight: '1.25' }}>
                    {a.description}
                  </span>
                  {isUnlocked && a.unlockedAt && (
                    <span style={{ fontSize: '0.55rem', color: 'var(--color-cosmic-gold)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                      LOGGED: {new Date(a.unlockedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={handleResetAll} aria-label="Wipe all telemetry records" style={resetBtnStyle}>
          ⚠️ WIPE TELEMETRY RECORDS
        </button>
      </div>

      {/* Share Badge Modal Overlay */}
      {showShareModal && (
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 8, 16, 0.85)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => setShowShareModal(false)}
        >
          {/* Card body */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
            style={{
              width: '320px',
              background: 'linear-gradient(135deg, #0A0E2A 0%, #050810 100%)',
              border: '2px solid var(--color-cosmic-gold)',
              boxShadow: '0 0 40px rgba(245, 166, 35, 0.4)',
              padding: '2rem',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              position: 'relative',
              animation: 'pulse 2s infinite ease-in-out alternate',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: '3.5rem',
                padding: '12px',
                background: 'rgba(245, 166, 35, 0.1)',
                border: '1.5px solid var(--color-cosmic-gold)',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {profile.avatar}
            </div>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-cosmic-gold)', fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}>
                OFFICIAL RECRUITMENT LOG
              </span>
              <h2 id="share-modal-title" style={{ fontSize: '1.4rem', color: '#fff', margin: '4px 0 2px 0' }}>
                {profile.username}
              </h2>
              <div style={{ color: 'var(--color-teal-cyan)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {profile.rank} (Lvl {profile.level})
              </div>
            </div>

            {/* Sub stats */}
            <div style={{ width: '100%', background: 'rgba(5, 8, 16, 0.5)', border: '1px solid rgba(74, 144, 226, 0.15)', borderRadius: '6px', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-muted)' }}>DECORATIONS</span>
                <span style={{ color: 'var(--color-cosmic-gold)', fontSize: '0.95rem', fontWeight: 'bold' }}>{unlockedCount}</span>
              </div>
              <div style={{ borderRight: '1px solid rgba(74, 144, 226, 0.15)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-muted)' }}>XP SCORES</span>
                <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 'bold' }}>{profile.xp}</span>
              </div>
            </div>

            {/* Share action */}
            <button
              onClick={() => {
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 2000);
              }}
              style={{
                width: '100%',
                background: 'rgba(0, 240, 255, 0.15)',
                border: '1px solid var(--color-teal-cyan)',
                color: 'var(--color-teal-cyan)',
                padding: '0.5rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontSize: '0.75rem',
                letterSpacing: '1px',
                marginTop: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              {shareSuccess ? 'LINK COPIED TO CLIPBOARD!' : 'COPY LOG SHARE LINK'}
            </button>

            <button
              onClick={() => setShowShareModal(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-muted)',
                fontSize: '0.7rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                textDecoration: 'underline',
              }}
            >
              DISMISS TRANSPONDER
            </button>
          </div>
        </div>
      )}

      {/* Confirm Database Wipe Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="CRITICAL: TELEMETRY PURGE"
        message="Are you sure you want to wipe the exploration database? This will permanently delete all achievements, XP, and customized settings."
        confirmLabel="ENGAGE PURGE"
        cancelLabel="ABORT DETONATION"
        onConfirm={handleConfirmReset}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};

const statBox: React.CSSProperties = {
  background: 'rgba(5, 8, 16, 0.4)',
  border: '1px solid rgba(245, 166, 35, 0.15)',
  padding: '6px',
  borderRadius: '4px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '2px',
};

const actionBtn = (primary: boolean): React.CSSProperties => ({
  flex: 1,
  background: primary ? 'rgba(245, 166, 35, 0.15)' : 'rgba(5, 8, 16, 0.6)',
  border: primary ? '1px solid var(--color-cosmic-gold)' : '1px solid rgba(74, 144, 226, 0.15)',
  color: primary ? 'var(--color-cosmic-gold)' : 'var(--color-muted)',
  padding: '0.3rem 0',
  borderRadius: '4px',
  fontSize: '0.7rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
});

const shareBtnStyle: React.CSSProperties = {
  background: 'rgba(245, 166, 35, 0.1)',
  border: '1px solid var(--color-cosmic-gold)',
  color: 'var(--color-cosmic-gold)',
  padding: '0.5rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  fontSize: '0.75rem',
  letterSpacing: '1px',
  transition: 'all 0.15s ease',
  marginTop: '4px',
  textShadow: '0 0 10px rgba(245, 166, 35, 0.3)',
};

const resetBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--color-muted)',
  fontSize: '0.65rem',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
  textDecoration: 'underline',
  marginTop: '8px',
  alignSelf: 'center',
  opacity: 0.65,
};
