import React, { useState, useRef, useEffect } from 'react';
import { usePlanetStore } from '../store/usePlanetStore';
import { askAIGuide, GuideMessage } from '../spacecraft/AIGuide';

export const GuideChatPanel: React.FC = () => {
  const selectedPlanetId = usePlanetStore((state) => state.selectedPlanetId) || 'earth';
  const [messages, setMessages] = useState<GuideMessage[]>([
    {
      sender: 'nova',
      text: "NOVA holographic guide initialized. Currently standing by. Select a planet and trigger scanning parameters or input manual inquiries.",
      timestamp: new Date(),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeMessageText, setActiveMessageText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeMessageText]);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || isStreaming) return;

    // 1. Add User Message
    const userMsg: GuideMessage = {
      sender: 'user',
      text: messageText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsStreaming(true);
    setActiveMessageText('');

    // 2. Stream AI response
    let currentResponseText = '';
    await askAIGuide(
      messageText,
      selectedPlanetId,
      (chunk) => {
        currentResponseText += chunk;
        setActiveMessageText(currentResponseText);
      },
      () => {
        // Complete
        const aiMsg: GuideMessage = {
          sender: 'nova',
          text: currentResponseText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setActiveMessageText('');
        setIsStreaming(false);
      },
      (error) => {
        // Error
        const errMsg: GuideMessage = {
          sender: 'nova',
          text: `[COMMUNICATION ERROR]: System failed to link with guidance relay. ${error.message}.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
        setActiveMessageText('');
        setIsStreaming(false);
      }
    );
  };

  const handleShortcutClick = (shortcutType: string) => {
    if (isStreaming) return;
    let text = '';
    switch (shortcutType) {
      case 'atmosphere':
        text = `Scan atmosphere parameters for ${selectedPlanetId.toUpperCase()}.`;
        break;
      case 'gravity':
        text = `Calculate surface gravity structural load for ${selectedPlanetId.toUpperCase()}.`;
        break;
      case 'life':
        text = `Assess astrobiological and habitability markers on ${selectedPlanetId.toUpperCase()}.`;
        break;
      default:
        text = `Provide system telemetry updates for ${selectedPlanetId.toUpperCase()}.`;
    }
    handleSend(text);
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'var(--space-2)',
        right: 'var(--space-2)',
        width: '350px',
        height: '420px',
        zIndex: 'var(--z-panel)',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(5, 8, 22, 0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        boxShadow: '0 0 25px rgba(0, 240, 255, 0.1)',
        borderRadius: '10px',
        fontFamily: 'var(--font-display)',
        overflow: 'hidden',
      }}
    >
      {/* HUD Header with spinning Hologram icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0.8rem 1rem',
          borderBottom: '1px solid rgba(0, 240, 255, 0.15)',
          background: 'rgba(0, 240, 255, 0.05)',
        }}
      >
        {/* Hologram Circle */}
        <div style={{ position: 'relative', width: '32px', height: '32px' }}>
          <svg
            viewBox="0 0 100 100"
            style={{
              width: '100%',
              height: '100%',
              animation: isStreaming ? 'spin 1.5s linear infinite' : 'spin 6s linear infinite',
              transformOrigin: 'center',
            }}
          >
            <circle cx="50" cy="50" r="42" stroke="#00f0ff" strokeWidth="4" fill="none" strokeDasharray="30 20" />
            <circle cx="50" cy="50" r="30" stroke="#00bcd4" strokeWidth="3" fill="none" strokeDasharray="10 15" />
            <circle cx="50" cy="50" r="16" stroke="#fff" strokeWidth="2" fill="none" />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#00f0ff',
              boxShadow: '0 0 8px #00f0ff',
              animation: 'pulse 1s ease-in-out infinite alternate',
            }}
          />
        </div>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold', letterSpacing: '1px' }}>
            NOVA V1.2
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-teal-cyan)', fontFamily: 'var(--font-mono)' }}>
            {isStreaming ? 'STREAMING LINK...' : 'STANDBY // ORBIT_READY'}
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          padding: '1rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          scrollBehavior: 'smooth',
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.sender === 'user' ? 'rgba(74, 144, 226, 0.15)' : 'rgba(0, 240, 255, 0.05)',
              border: msg.sender === 'user' ? '1px solid rgba(74, 144, 226, 0.3)' : '1px solid rgba(0, 240, 255, 0.15)',
              padding: '0.6rem 0.8rem',
              borderRadius: msg.sender === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
              fontSize: '0.8rem',
              color: msg.sender === 'user' ? '#fff' : 'var(--color-starlight)',
              lineHeight: '1.4',
              fontFamily: msg.sender === 'nova' ? 'var(--font-mono)' : 'var(--font-display)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {msg.text}
          </div>
        ))}

        {/* Streaming Chunk Typewriter Display */}
        {isStreaming && activeMessageText && (
          <div
            style={{
              alignSelf: 'flex-start',
              maxWidth: '85%',
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              padding: '0.6rem 0.8rem',
              borderRadius: '10px 10px 10px 2px',
              fontSize: '0.8rem',
              color: 'var(--color-teal-cyan)',
              lineHeight: '1.4',
              fontFamily: 'var(--font-mono)',
              whiteSpace: 'pre-wrap',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.15)',
            }}
          >
            {activeMessageText}
            <span style={{ display: 'inline-block', width: '6px', height: '12px', background: '#00f0ff', marginLeft: '4px', animation: 'pulse 0.4s infinite alternate' }} />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Shortcuts Bar */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '0.3rem 0.8rem',
          background: 'rgba(5, 8, 16, 0.4)',
          borderTop: '1px solid rgba(0, 240, 255, 0.1)',
        }}
      >
        <button
          onClick={() => handleShortcutClick('atmosphere')}
          disabled={isStreaming}
          style={shortcutBtnStyle}
        >
          ATMOSPHERE
        </button>
        <button
          onClick={() => handleShortcutClick('gravity')}
          disabled={isStreaming}
          style={shortcutBtnStyle}
        >
          GRAVITY
        </button>
        <button
          onClick={() => handleShortcutClick('life')}
          disabled={isStreaming}
          style={shortcutBtnStyle}
        >
          HABITABILITY
        </button>
      </div>

      {/* Chat Form Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputVal);
        }}
        style={{
          display: 'flex',
          padding: '8px',
          background: 'rgba(10, 14, 42, 0.6)',
          borderTop: '1px solid rgba(0, 240, 255, 0.15)',
        }}
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={isStreaming ? 'RELAY IN PROGRESS...' : `Query NOVA about ${selectedPlanetId.toUpperCase()}...`}
          disabled={isStreaming}
          style={{
            flex: 1,
            background: 'rgba(5, 8, 16, 0.7)',
            border: '1px solid rgba(0, 240, 255, 0.2)',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '0.8rem',
            padding: '0.5rem 0.8rem',
            outline: 'none',
            fontFamily: 'var(--font-display)',
          }}
        />
        <button
          type="submit"
          disabled={isStreaming || !inputVal.trim()}
          style={{
            background: 'transparent',
            border: 'none',
            color: isStreaming || !inputVal.trim() ? 'var(--color-muted)' : '#00f0ff',
            cursor: isStreaming || !inputVal.trim() ? 'default' : 'pointer',
            padding: '0 0.8rem',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            transition: 'color 0.2s',
          }}
        >
          SEND
        </button>
      </form>

      {/* CSS Spin effect */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const shortcutBtnStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(0, 240, 255, 0.05)',
  border: '1px solid rgba(0, 240, 255, 0.15)',
  color: 'var(--color-teal-cyan)',
  borderRadius: '3px',
  fontSize: '0.6rem',
  padding: '4px 2px',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.5px',
  transition: 'all 0.15s ease',
};
