import { useEffect, useRef, useCallback } from 'react';

interface UseActivityTrackerProps {
  onInactivityTimeout: () => void;
  timeoutMinutes?: number;
  isActive?: boolean;
}

export function useActivityTracker({ 
  onInactivityTimeout, 
  timeoutMinutes = 5,
  isActive = true 
}: UseActivityTrackerProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    if (!isActive) return;
    
    lastActivityRef.current = Date.now();
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onInactivityTimeout();
    }, timeoutMinutes * 60 * 1000); // Convert minutes to milliseconds
  }, [onInactivityTimeout, timeoutMinutes, isActive]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!isActive) {
      // Clear timeout if not active
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // List of events that indicate user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'focus',
      'blur'
    ];

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the initial timer
    resetTimer();

    // Cleanup on unmount
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleActivity, resetTimer, isActive]);

  // Function to manually reset the timer (if needed)
  const manualReset = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  return {
    manualReset,
    lastActivity: lastActivityRef.current
  };
}