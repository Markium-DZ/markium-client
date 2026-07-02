import { useState } from 'react';

import Fab from '@mui/material/Fab';
import Zoom from '@mui/material/Zoom';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';

import ChatAssistant from './chat-assistant';

// ----------------------------------------------------------------------

export default function ChatAssistantWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Zoom in={!open}>
        <Fab
          color="primary"
          aria-label="Store assistant"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            right: 24,
            bottom: { xs: 80, md: 24 },
            zIndex: (theme) => theme.zIndex.speedDial,
          }}
        >
          <Iconify icon="solar:chat-round-dots-bold" width={26} />
        </Fab>
      </Zoom>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{
          sx: { width: { xs: 1, sm: 400 }, display: 'flex', flexDirection: 'column' },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2, borderBottom: (theme) => `solid 1px ${theme.palette.divider}` }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:chat-round-dots-bold" width={22} sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle1">Store assistant</Typography>
          </Stack>
          <IconButton onClick={() => setOpen(false)}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Stack>

        <ChatAssistant />
      </Drawer>
    </>
  );
}
