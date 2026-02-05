import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

const LiveRegionContext = createContext(null);

export const useLiveRegion = () => useContext(LiveRegionContext);

export default function LiveRegionProvider({ children }) {
  const [message, setMessage] = useState('');

  const announce = useCallback((text) => {
    // Clear first to ensure re-announcement of same message
    setMessage('');
    requestAnimationFrame(() => {
      setMessage(text);
    });
  }, []);

  const value = useMemo(() => ({ announce }), [announce]);

  return (
    <LiveRegionContext.Provider value={value}>
      {children}
      <Box
        aria-live="polite"
        aria-atomic="true"
        role="status"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          p: 0,
          m: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
      >
        {message}
      </Box>
    </LiveRegionContext.Provider>
  );
}

LiveRegionProvider.propTypes = {
  children: PropTypes.node,
};
