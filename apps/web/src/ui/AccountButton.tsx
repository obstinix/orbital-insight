import React, { useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useAccountStore } from '../store/useAccountStore';

interface AccountButtonProps {
  rank: string;
  level: number;
  username: string;
  avatar: string;
}

const connectButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px',
  background: 'transparent',
  border: '1px solid var(--color-teal-cyan)',
  color: 'var(--color-teal-cyan)',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  fontFamily: 'var(--font-display)',
  fontWeight: 'bold',
  letterSpacing: '1px',
  boxShadow: '0 0 8px rgba(0, 240, 255, 0.15)',
  animation: 'pulse-neon 2s infinite alternate',
};

const pulseKeyframes = `
  @keyframes pulse-neon {
    0% { box-shadow: 0 0 4px rgba(0, 240, 255, 0.15); border-color: rgba(0, 240, 255, 0.5); }
    100% { box-shadow: 0 0 12px rgba(0, 240, 255, 0.50); border-color: rgba(0, 240, 255, 1); }
  }
`;

const RealAccountButton: React.FC<AccountButtonProps> = ({ rank, level }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut, openSignIn } = useClerk();

  if (!isLoaded) {
    return (
      <div style={{ color: 'var(--color-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
        Authenticating...
      </div>
    );
  }

  if (isSignedIn && user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src={user.imageUrl}
            alt="Avatar"
            style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--color-teal-cyan)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>
              {user.username || user.firstName || 'Explorer'}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-teal-cyan)', fontFamily: 'var(--font-mono)' }}>
              {rank} (Lvl {level})
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          style={{
            padding: '4px 8px',
            background: 'rgba(255, 59, 48, 0.1)',
            border: '1px solid rgba(255, 59, 48, 0.3)',
            color: '#ff3b30',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-display)',
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => openSignIn()}
      style={connectButtonStyle}
    >
      CONNECT EXPLORER
      <style>{pulseKeyframes}</style>
    </button>
  );
};

const MockAccountButton: React.FC<AccountButtonProps> = ({ rank, level, username, avatar }) => {
  const [mockSignedIn, setMockSignedIn] = useState(false);

  if (mockSignedIn) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem' }}>{avatar}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>
              {username} (Mock)
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--color-teal-cyan)', fontFamily: 'var(--font-mono)' }}>
              {rank} (Lvl {level})
            </span>
          </div>
        </div>
        <button
          onClick={() => setMockSignedIn(false)}
          style={{
            padding: '4px 8px',
            background: 'rgba(255, 59, 48, 0.1)',
            border: '1px solid rgba(255, 59, 48, 0.3)',
            color: '#ff3b30',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-display)',
          }}
        >
          Disconnect (Mock)
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setMockSignedIn(true)}
      style={connectButtonStyle}
    >
      CONNECT EXPLORER
      <style>{pulseKeyframes}</style>
    </button>
  );
};

export const AccountButton: React.FC = () => {
  const hasClerkKey = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const profile = useAccountStore((state) => state.profile);

  if (hasClerkKey) {
    return (
      <RealAccountButton
        rank={profile.rank}
        level={profile.level}
        username={profile.username}
        avatar={profile.avatar}
      />
    );
  }

  return (
    <MockAccountButton
      rank={profile.rank}
      level={profile.level}
      username={profile.username}
      avatar={profile.avatar}
    />
  );
};
