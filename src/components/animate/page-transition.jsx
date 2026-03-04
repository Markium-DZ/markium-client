import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSettingsContext } from 'src/components/settings';

const variants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction === 'rtl' ? -20 : 20,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction === 'rtl' ? 20 : -20,
    transition: { duration: 0.15, ease: 'easeIn' },
  }),
};

export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const settings = useSettingsContext();
  const direction = settings?.themeDirection || 'rtl';
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Skip page transition on mobile — bottom nav tabs should feel instant
  if (isMobile) {
    return <div style={{ flex: 1 }}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={pathname}
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ flex: 1 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
