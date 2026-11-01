'use client';

import { useState, useEffect } from 'react';
import { LiffState } from '@/types/sticker';
import { initializeLiff, loginLiff, logoutLiff, closeLiffWindow } from '@/lib/liff';

export function useLiff(liffId?: string) {
  const [liffState, setLiffState] = useState<LiffState>({
    isInitialized: false,
    isInClient: false,
    isLoggedIn: false,
    profile: null,
    error: null,
    isMock: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      setIsLoading(true);
      const state = await initializeLiff(liffId);
      if (isMounted) {
        setLiffState(state);
        setIsLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [liffId]);

  return {
    ...liffState,
    isLoading,
    login: loginLiff,
    logout: logoutLiff,
    closeWindow: closeLiffWindow,
  };
}
