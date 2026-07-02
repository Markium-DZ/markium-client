import remarkGfm from 'remark-gfm';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { CHAT_HOST_API } from 'src/config-global';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

// The dashboard's own Sanctum token is forwarded to the Host, which verifies it
// and mints a scoped MCP token server-side. Same identity, no separate login.
const transport = new DefaultChatTransport({
  api: `${CHAT_HOST_API}/chat`,
  headers: () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` }),
});

const textOf = (message) =>
  message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');

const isToolPart = (part) => typeof part.type === 'string' && part.type.startsWith('tool');

export default function ChatAssistant() {
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  const busy = status === 'submitted' || status === 'streaming';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) {
      return;
    }
    sendMessage({ text });
    setInput('');
  };

  return (
    <Stack sx={{ height: 1, minHeight: 0 }}>
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {messages.length === 0 && (
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', m: 'auto', textAlign: 'center', px: 2 }}
          >
            Ask me to manage your store — add a product, check your orders, update your layout…
          </Typography>
        )}

        {messages.map((message) => {
          const isUser = message.role === 'user';
          const text = textOf(message);
          const working = !text && message.parts.some(isToolPart);

          let body;
          if (working) {
            body = (
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={14} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Working…
                </Typography>
              </Stack>
            );
          } else if (isUser) {
            body = <Typography variant="body2">{text}</Typography>;
          } else {
            body = (
              <Box
                sx={{
                  typography: 'body2',
                  '& p': { m: 0 },
                  '& p + p': { mt: 1 },
                  '& ul, & ol': { m: 0, pl: 2.5 },
                  '& li': { mb: 0.25 },
                  '& h1, & h2, & h3, & h4': { m: 0, mb: 0.5, typography: 'subtitle2' },
                  '& code': {
                    px: 0.5,
                    borderRadius: 0.5,
                    bgcolor: 'action.hover',
                    fontFamily: 'monospace',
                    fontSize: '0.85em',
                  },
                  '& a': { color: 'primary.main' },
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
              </Box>
            );
          }

          return (
            <Stack
              key={message.id}
              direction="row"
              justifyContent={isUser ? 'flex-end' : 'flex-start'}
            >
              <Paper
                elevation={0}
                sx={{
                  px: 1.5,
                  py: 1,
                  maxWidth: 0.85,
                  borderRadius: 1.5,
                  whiteSpace: 'pre-wrap',
                  bgcolor: isUser ? 'primary.main' : 'background.neutral',
                  color: isUser ? 'primary.contrastText' : 'text.primary',
                }}
              >
                {body}
              </Paper>
            </Stack>
          );
        })}

        {status === 'submitted' && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
            <CircularProgress size={14} />
            <Typography variant="caption">Thinking…</Typography>
          </Stack>
        )}

        {error && (
          <Typography variant="caption" sx={{ color: 'error.main' }}>
            Something went wrong. Please try again.
          </Typography>
        )}

        <Box ref={endRef} />
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 1.5, borderTop: (theme) => `solid 1px ${theme.palette.divider}` }}
      >
        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            fullWidth
            size="small"
            multiline
            maxRows={4}
            placeholder="Type a message…"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                handleSubmit(event);
              }
            }}
          />
          <IconButton type="submit" color="primary" disabled={!input.trim() || busy}>
            <Iconify icon="solar:plain-bold" />
          </IconButton>
        </Stack>
      </Box>
    </Stack>
  );
}
