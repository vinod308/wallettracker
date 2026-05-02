/**
 * useInactivity Hook
 * Implements 30-minute inactivity timeout with 28-minute warning
 * Exact from specification (Section 9)
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { SESSION_TIMEOUT_MINUTES, INACTIVITY_WARNING_MINUTES } from '../utils/constants';

export const useInactivity = () => {
  const { logout, isAuthenticated } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownRef = useRef(null);

  const resetTimer = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Hide warning if shown
    setShowWarning(false);
    setRemainingTime(null);

    if (!isAuthenticated) return;

    // Set warning timeout (28 minutes from spec)
    const warningMs = INACTIVITY_WARNING_MINUTES * 60 * 1000;
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(120); // 2 minutes = 120 seconds

      // Start countdown
      countdownRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningMs);

    // Set auto-logout timeout (30 minutes from spec)
    const logoutMs = SESSION_TIMEOUT_MINUTES * 60 * 1000;
    timeoutRef.current = setTimeout(async () => {
      await logout();
      window.location.href = '/login?reason=inactivity';
    }, logoutMs);
  }, [isAuthenticated, logout]);

  // Stay logged in (reset timer)
  const stayLoggedIn = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAuthenticated, resetTimer]);

  return {
    showWarning,
    remainingTime,
    stayLoggedIn,
  };
};
