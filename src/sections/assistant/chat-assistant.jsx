import remarkGfm from 'remark-gfm';
import PropTypes from 'prop-types';
import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import { useRef, useState, useEffect } from 'react';
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { CHAT_HOST_API } from 'src/config-global';

import Iconify from 'src/components/iconify';

import { ToolStatus, ToolChoice, ToolApproval, ToolFieldForm } from './assistant-tools';

// ----------------------------------------------------------------------

// The dashboard's own Sanctum token is forwarded to the Host, which verifies it
// and mints a scoped MCP token server-side. Same identity, no separate login.
const transport = new DefaultChatTransport({
  api: `${CHAT_HOST_API}/chat`,
  headers: () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` }),
});

function TextBubble({ isUser, text }) {
  return (
    <Stack direction="row" justifyContent={isUser ? 'flex-end' : 'flex-start'}>
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
        {isUser ? (
          <Typography variant="body2">{text}</Typography>
        ) : (
          <Box
            sx={{
              typography: 'body2',
              '& p': { m: 0 },
              '& p + p': { mt: 1 },
              '& ul, & ol': { m: 0, pl: 2.5 },
              '& strong': { fontWeight: 700 },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </Box>
        )}
      </Paper>
    </Stack>
  );
}

TextBubble.propTypes = {
  isUser: PropTypes.bool,
  text: PropTypes.string,
};

export default function ChatAssistant() {
  const { messages, sendMessage, status, error, addToolOutput } = useChat({
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });
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

  const renderPart = (message, part, key) => {
    if (part.type === 'text') {
      return part.text ? (
        <TextBubble key={key} isUser={message.role === 'user'} text={part.text} />
      ) : null;
    }

    // Resolve the tool name for both `tool-<name>` and `dynamic-tool` parts.
    let toolName = null;
    if (part.type === 'dynamic-tool') {
      toolName = part.toolName;
    } else if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
      toolName = part.type.slice('tool-'.length);
    }
    if (!toolName) {
      return null;
    }

    const id = part.toolCallId ?? key;
    const done = part.state === 'output-available';
    const uiReady = part.state === 'input-available' || done;

    if (toolName === 'request_fields') {
      return uiReady ? (
        <ToolFieldForm
          key={id}
          input={part.input}
          disabled={done}
          submitted={done ? part.output : null}
          onSubmit={(output) => addToolOutput({ tool: 'request_fields', toolCallId: id, output })}
        />
      ) : null;
    }
    if (toolName === 'request_approval') {
      return uiReady ? (
        <ToolApproval
          key={id}
          input={part.input}
          disabled={done}
          decision={done ? part.output : null}
          onApprove={() => addToolOutput({ tool: 'request_approval', toolCallId: id, output: 'approved' })}
          onRequestChanges={() =>
            addToolOutput({ tool: 'request_approval', toolCallId: id, output: 'changes_requested' })
          }
        />
      ) : null;
    }
    if (toolName === 'ask_choice') {
      return uiReady ? (
        <ToolChoice
          key={id}
          input={part.input}
          disabled={done}
          chosen={done ? part.output : null}
          onChoose={(opt) => addToolOutput({ tool: 'ask_choice', toolCallId: id, output: opt })}
        />
      ) : null;
    }

    // Server-executed tools (link reader, skills, store actions) -> live progress line.
    return <ToolStatus key={id} toolName={toolName} done={done} />;
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
            اطلب مني إدارة متجرك — أضِف منتجًا، تحقّق من طلباتك، حدّث تصميم متجرك…
          </Typography>
        )}

        {messages.map((message) => (
          <Box key={message.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {message.parts.map((part, i) => renderPart(message, part, `${message.id}-${i}`))}
          </Box>
        ))}

        {status === 'submitted' && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
            <CircularProgress size={14} />
            <Typography variant="caption">أفكّر…</Typography>
          </Stack>
        )}

        {error && (
          <Typography variant="caption" sx={{ color: 'error.main' }}>
            حدث خطأ ما. حاول مرة أخرى.
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
            placeholder="اكتب رسالة…"
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
