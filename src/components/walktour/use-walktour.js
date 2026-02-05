import { useState, useCallback, useEffect } from 'react';

// ----------------------------------------------------------------------

const STORAGE_KEY = 'markium-guided-tour-completed';

export function useWalktour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (completed !== 'true') {
      // Small delay to let the page render first
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  const handleCallback = useCallback((data) => {
    const { status } = data;
    const finishedStatuses = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRun(true);
  }, []);

  return {
    run,
    handleCallback,
    resetTour,
  };
}
