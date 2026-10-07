import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import { useResponsive } from 'src/hooks/use-responsive';

import { useSettingsContext } from 'src/components/settings';

import { NAV, HEADER } from '../config-layout';

// ----------------------------------------------------------------------

const SPACING = 8;

export default function Main({ children, sx, ...other }) {
  const settings = useSettingsContext();

  const lgUp = useResponsive('up', 'lg');

  const isNavHorizontal = settings.themeLayout === 'horizontal';

  const isNavMini = settings.themeLayout === 'mini';

  if (isNavHorizontal) {
    return (
      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          minHeight: 1,
          display: 'flex',
          flexDirection: 'column',
          pt: lgUp
            ? `${HEADER.H_MOBILE * 2 + 40}px`
            : `calc(${HEADER.H_MOBILE + 24}px + env(safe-area-inset-top))`,
          pb: lgUp ? 15 : 10,
          outline: 'none',
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box
      component="main"
      id="main-content"
      tabIndex={-1}
      sx={{
        flexGrow: 1,
        minHeight: 1,
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        pt: lgUp
          ? `${HEADER.H_DESKTOP + SPACING}px`
          : `calc(${HEADER.H_MOBILE + SPACING}px + env(safe-area-inset-top))`,
        pb: `${HEADER.H_MOBILE + SPACING}px`,
        ...(lgUp && {
          px: 2,
          py: `${HEADER.H_DESKTOP + SPACING}px`,
          width: `calc(100% - ${NAV.W_VERTICAL}px)`,
          ...(isNavMini && {
            width: `calc(100% - ${NAV.W_MINI}px)`,
          }),
        }),
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}

Main.propTypes = {
  children: PropTypes.node,
  sx: PropTypes.object,
};
