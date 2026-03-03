import { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

const THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children }) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pullDistance = useMotionValue(0);
  const opacity = useTransform(pullDistance, [0, THRESHOLD], [0, 1]);
  const scale = useTransform(pullDistance, [0, THRESHOLD], [0.5, 1]);

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (refreshing || window.scrollY > 0) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        pullDistance.set(Math.min(diff * 0.5, THRESHOLD + 20));
      }
    },
    [refreshing, pullDistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance.get() >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      pullDistance.set(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        pullDistance.set(0);
      }
      if (navigator.vibrate) navigator.vibrate(10);
    } else {
      pullDistance.set(0);
    }
  }, [pullDistance, refreshing, onRefresh]);

  return (
    <Box
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{ position: 'relative' }}
    >
      <motion.div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 8,
          paddingBottom: 8,
          opacity,
          scale,
        }}
      >
        <CircularProgress size={24} thickness={4} />
      </motion.div>
      {children}
    </Box>
  );
}
