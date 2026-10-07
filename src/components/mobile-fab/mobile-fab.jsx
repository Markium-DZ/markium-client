import { useState, useEffect } from 'react';
import Fab from '@mui/material/Fab';
import Zoom from '@mui/material/Zoom';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Iconify from 'src/components/iconify';
import { NAV_HEIGHT } from 'src/layouts/dashboard/bottom-nav';

export default function MobileFab({ icon = 'mingcute:add-line', onClick, href, component, ...other }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isMobile) return;
    // Delay FAB until page is fully painted and settled
    const id = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(id);
  }, [isMobile]);

  if (!isMobile) return null;

  return (
    <Zoom in={visible} unmountOnExit>
      <Fab
        color="primary"
        onClick={onClick}
        href={href}
        component={component}
        sx={{
          position: 'fixed',
          bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom) + 16px)`,
          insetInlineEnd: 16,
          zIndex: theme.zIndex.fab,
          boxShadow: theme.shadows[8],
        }}
        {...other}
      >
        <Iconify icon={icon} width={24} />
      </Fab>
    </Zoom>
  );
}
