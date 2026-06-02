import React from 'react';
import { useJourneyStore, CHAPTERS } from '../store/useJourneyStore';
import { useEngineStore } from '../store/useEngineStore';

export const ChapterSelector: React.FC = () => {
  const currentChapterId = useJourneyStore((state) => state.currentChapterId);
  const isTransitioning = useJourneyStore((state) => state.isTransitioning);
  const activeChapter = CHAPTERS.find((c) => c.id === currentChapterId) || CHAPTERS[0];

  const handleChapterClick = async (chapterId: number) => {
    if (isTransitioning) return;
    
    const journeyMode = useEngineStore.getState().journeyMode;
    if (journeyMode) {
      await journeyMode.selectChapter(chapterId);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 'var(--space-2)',
        right: 'var(--space-2)',
        width: '320px',
        maxHeight: 'calc(100vh - 100px)',
        zIndex: 'var(--z-panel)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        overflow: 'hidden',
        animation: 'slideIn var(--duration-medium) var(--ease-warp) both',
      }}
    >
      {/* Active Chapter Details Card */}
      <div
        style={{
          background: 'rgba(10, 14, 42, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0, 240, 255, 0.25)',
          padding: '1.2rem',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--color-teal-cyan)',
            letterSpacing: '1.5px',
          }}
        >
          ACTIVE MISSION SECTOR
        </span>
        <h2 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, fontFamily: 'var(--font-display)' }}>
          {activeChapter.title}
        </h2>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'rgba(0, 240, 255, 0.75)',
          }}
        >
          SCALE: {activeChapter.scaleLabel}
        </span>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', lineHeight: '1.4', margin: '4px 0 0 0' }}>
          {activeChapter.description}
        </p>

        {isTransitioning && (
          <div
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              background: 'rgba(245, 166, 35, 0.1)',
              border: '1px solid rgba(245, 166, 35, 0.3)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: '#f5a623',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              animation: 'pulse 1s infinite alternate',
            }}
          >
            HYPERDRIVE ENGAGED // WARPING SPATIAL SECTORS
          </div>
        )}
      </div>

      {/* Chapter Grid Selector list */}
      <div
        style={{
          background: 'rgba(10, 14, 42, 0.7)',
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
          COSMIC RADIAL SCALE TARGETS
        </span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {CHAPTERS.map((ch) => {
            const isActive = ch.id === currentChapterId;
            return (
              <button
                key={ch.id}
                onClick={() => handleChapterClick(ch.id)}
                disabled={isTransitioning}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: isActive
                    ? 'rgba(0, 240, 255, 0.1)'
                    : isTransitioning
                    ? 'rgba(10, 14, 42, 0.3)'
                    : 'rgba(5, 8, 16, 0.4)',
                  border: isActive
                    ? '1px solid rgba(0, 240, 255, 0.5)'
                    : '1px solid rgba(74, 144, 226, 0.15)',
                  padding: '0.5rem 0.8rem',
                  borderRadius: '4px',
                  cursor: isTransitioning ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.8rem',
                      color: isActive ? '#fff' : 'var(--color-starlight)',
                      fontWeight: isActive ? 'bold' : 'normal',
                    }}
                  >
                    Ch {ch.id}: {ch.title}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6rem',
                      color: isActive ? 'var(--color-teal-cyan)' : 'var(--color-muted)',
                    }}
                  >
                    {ch.scaleLabel}
                  </span>
                </div>
                {isActive && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#00f0ff',
                      boxShadow: '0 0 6px #00f0ff',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
