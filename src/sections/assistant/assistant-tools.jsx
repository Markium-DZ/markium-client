import { useState } from 'react';
import remarkGfm from 'remark-gfm';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

const cardSx = {
  p: 1.5,
  mt: 0.5,
  borderRadius: 1.5,
  border: (theme) => `solid 1px ${theme.palette.divider}`,
  bgcolor: 'background.paper',
};

function coerce(type, value) {
  if (value === '' || value == null) return value;
  if (type === 'integer') return parseInt(value, 10);
  if (type === 'number' || type === 'price') return Number(value);
  return value;
}

function inputPropsFor(type) {
  if (type === 'integer') return { step: 1, min: 0 };
  if (type === 'number' || type === 'price') return { step: 'any', min: 0 };
  return {};
}

// ----------------------------------------------------------------------

export function ToolFieldForm({ input, disabled, submitted, onSubmit }) {
  const fields = input?.fields ?? [];
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, '']))
  );

  if (submitted) {
    return (
      <Paper elevation={0} sx={cardSx}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {fields.map((f) => (
            <Chip key={f.key} size="small" label={`${f.label}: ${submitted[f.key] ?? '—'}`} />
          ))}
        </Stack>
      </Paper>
    );
  }

  const numeric = (t) => t === 'number' || t === 'price' || t === 'integer';
  const canSubmit = fields.every((f) => String(values[f.key] ?? '').trim() !== '');

  return (
    <Paper
      elevation={0}
      component="form"
      sx={cardSx}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) {
          onSubmit(Object.fromEntries(fields.map((f) => [f.key, coerce(f.type, values[f.key])])));
        }
      }}
    >
      {input?.prompt && (
        <Typography variant="body2" sx={{ mb: 1 }}>{input.prompt}</Typography>
      )}
      <Stack spacing={1.25}>
        {fields.map((f) => (
          <TextField
            key={f.key}
            size="small"
            fullWidth
            label={f.label}
            placeholder={f.placeholder || ''}
            type={numeric(f.type) ? 'number' : 'text'}
            inputProps={inputPropsFor(f.type)}
            value={values[f.key] ?? ''}
            disabled={disabled}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
          />
        ))}
        <Button type="submit" variant="contained" size="small" disabled={disabled || !canSubmit}>
          Send
        </Button>
      </Stack>
    </Paper>
  );
}

ToolFieldForm.propTypes = {
  input: PropTypes.object,
  disabled: PropTypes.bool,
  submitted: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

export function ToolApproval({ input, disabled, decision, onApprove, onRequestChanges }) {
  return (
    <Paper elevation={0} sx={cardSx}>
      {input?.title && (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>{input.title}</Typography>
      )}
      {input?.image_url && (
        <Box
          component="img"
          src={input.image_url}
          alt=""
          sx={{ width: 1, maxHeight: 200, objectFit: 'cover', borderRadius: 1, mb: 1 }}
        />
      )}
      <Box
        sx={{
          typography: 'body2',
          '& p': { m: 0, mb: 0.5 },
          '& ul, & ol': { m: 0, pl: 2.5 },
          '& strong': { fontWeight: 700 },
        }}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{input?.preview_markdown ?? ''}</ReactMarkdown>
      </Box>

      {decision ? (
        <Chip
          size="small"
          sx={{ mt: 1 }}
          color={decision === 'approved' ? 'success' : 'default'}
          label={decision === 'approved' ? 'Approved' : 'Changes requested'}
        />
      ) : (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button variant="contained" size="small" color="success" disabled={disabled} onClick={onApprove}>
            Approve &amp; publish
          </Button>
          <Button variant="outlined" size="small" disabled={disabled} onClick={onRequestChanges}>
            Request changes
          </Button>
        </Stack>
      )}
    </Paper>
  );
}

ToolApproval.propTypes = {
  input: PropTypes.object,
  disabled: PropTypes.bool,
  decision: PropTypes.string,
  onApprove: PropTypes.func.isRequired,
  onRequestChanges: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

export function ToolChoice({ input, disabled, chosen, onChoose }) {
  const options = input?.options ?? [];

  return (
    <Paper elevation={0} sx={cardSx}>
      {input?.question && (
        <Typography variant="body2" sx={{ mb: 1 }}>{input.question}</Typography>
      )}
      {chosen ? (
        <Chip size="small" color="primary" label={chosen} />
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {options.map((opt) => (
            <Button key={opt} variant="outlined" size="small" disabled={disabled} onClick={() => onChoose(opt)}>
              {opt}
            </Button>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

ToolChoice.propTypes = {
  input: PropTypes.object,
  disabled: PropTypes.bool,
  chosen: PropTypes.string,
  onChoose: PropTypes.func.isRequired,
};
