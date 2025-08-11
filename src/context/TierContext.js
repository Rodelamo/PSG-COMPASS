// src/context/TierContext.js

import React, { createContext, useState, useContext, useMemo } from 'react';

// Create the context with a default null value.
const TierContext = createContext(null);

/**
 * The TierProvider component is a wrapper that will provide tier data
 * to all child components. It holds the state for the current user tier.
 */
export function TierProvider({ children }) {
  const [userTier, setUserTier] = useState('basic'); // The default tier is 'basic'.

  // We use useMemo to prevent unnecessary re-renders of components that consume the context.
  // This value object, including the derived booleans, will only be recalculated when `userTier` changes.
  const value = useMemo(() => ({
    userTier,
    setUserTier,
    // Current 2-tier system: Basic (CF + SF + full copedent) and Pro (+ CD + VL)
    isBasic: userTier === 'basic',
    isPro: userTier === 'pro',
  }), [userTier]);

  return (
    <TierContext.Provider value={value}>
      {children}
    </TierContext.Provider>
  );
}

/**
 * A custom hook `useTier` to easily access the context's value.
 * This simplifies consumption in components and includes an error check.
 */
export const useTier = () => {
  const context = useContext(TierContext);
  if (context === null) {
    throw new Error('useTier must be used within a TierProvider');
  }
  return context;
};