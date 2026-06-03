import React, { useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useAccountStore } from '../store/useAccountStore';

export const AccountButton: React.FC = () => {
  // Check if we have a real Clerk key configured
  const hasClerkKey = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  // Real Clerk Hooks (safely called inside ClerkProvider)
  // Only execute real Clerk actions if key is active
  let isLoaded = false;
  let isSignedIn = false;
  let user: any = null;
  let signOut: any = () => {};
  let openSignIn: any = () => {};

  if (hasClerkKey) {
    try {
      const userRes = useUser();
      isLoaded = userRes.isLoaded;
      isSignedIn = userRes.isSignedIn || false;
      user = userRes.user;

      const clerkRes = useClerk();
      signOut = clerkRes.signOut;
      openSignIn = clerkRes.openSignIn;
    } catch (e) {
      console.warn('[Clerk] Context not fully loaded. Falling back to local state.');
    }
  }

  // Mock State hooks when Clerk is inactive
  const profile = useAccountStore((state) => state.profile);
  const [mockSignedIn, setMockSignedIn] = useState(false);

  // Sign out handler
  const handleSignOut = () => {
    if (hasClerkKey) {
      signOut();
    } else {
      setMockSignedIn(false);
    }
  };

  // Sign in handler
  const handleSignIn = () => {
    if (hasClerkKey) {
      openSignIn();
    } else {
      setMockSignedIn(true);
    }
  };

  if (hasClerkKey) {
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
                {profile.rank} (Lvl {profile.level})
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
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
  } else {
    // Render Developer Mock Auth UI
    if (mockSignedIn) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>{profile.avatar}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>
                {profile.username} (Mock)
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--color-teal-cyan)', fontFamily: 'var(--font-mono)' }}>
                {profile.rank} (Lvl {profile.level})
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
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
  }

  // Signed out visual (pulsing neon connect button)
  return (
    <button
      onClick={handleSignIn}
      style={{
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
      }}
    >
      CONNECT EXPLORER
      <style>{`
        @keyframes pulse-neon {
          0% { box-shadow: 0 0 4px rgba(0, 240, 255, 0.15); border-color: rgba(0, 240, 255, 0.5); }
          100% { box-shadow: 0 0 12px rgba(0, 240, 255, 0.50); border-color: rgba(0, 240, 255, 1); }
        }
      `}</style>
    </button>
  );
};
