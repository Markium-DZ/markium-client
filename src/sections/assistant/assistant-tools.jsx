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
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';

import Iconify from 'src/components/iconify';

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

// Live progress labels — translation keys under assistant.*.
const ACTIVITY = {
  list_skills: 'assistant.activity_preparing',
  load_skill: 'assistant.activity_preparing',
  get_me: 'assistant.activity_checking_store',
  upload_media: 'assistant.activity_uploading_image',
  create_product: 'assistant.activity_creating_product',
  create_product_listing: 'assistant.activity_creating_product',
  deploy_product: 'assistant.activity_publishing',
  list_products: 'assistant.activity_searching_products',
};

// Known sources → a recognizable brand icon (favicon-like), so the progress line
// shows WHERE the assistant is reading from (Instagram, Facebook…).
const SOURCES = [
  { match: 'instagram', name: 'Instagram', icon: 'skill-icons:instagram' },
  { match: 'facebook', name: 'Facebook', icon: 'logos:facebook' },
  { match: 'fb.com', name: 'Facebook', icon: 'logos:facebook' },
  { match: 'tiktok', name: 'TikTok', icon: 'logos:tiktok-icon' },
  { match: 'whatsapp', name: 'WhatsApp', icon: 'logos:whatsapp-icon' },
  { match: 'wa.me', name: 'WhatsApp', icon: 'logos:whatsapp-icon' },
];

function sourceFromUrl(url, fallbackName) {
  if (typeof url !== 'string') return null;
  const lower = url.toLowerCase();
  const known = SOURCES.find((s) => lower.includes(s.match));
  if (known) return known;
  try {
    return { name: new URL(url).hostname.replace(/^www\./, ''), icon: 'mdi:web' };
  } catch {
    return { name: fallbackName, icon: 'mdi:web' };
  }
}

// ----------------------------------------------------------------------

export function ToolStatus({ toolName, done, input }) {
  const { t } = useTranslate();
  const source =
    toolName === 'fetch_social_post' ? sourceFromUrl(input?.url, t('assistant.website')) : null;
  const label = source
    ? t(done ? 'assistant.extracted_from' : 'assistant.extracting_from', { source: source.name })
    : t(ACTIVITY[toolName] ?? 'assistant.working');

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary', py: 0.25 }}>
      {done ? (
        <Iconify icon="eva:checkmark-fill" width={16} sx={{ color: 'success.main' }} />
      ) : (
        <CircularProgress size={12} />
      )}
      {source && <Iconify icon={source.icon} width={16} />}
      <Typography variant="caption">
        {label}
        {done ? '' : '…'}
      </Typography>
    </Stack>
  );
}

ToolStatus.propTypes = {
  toolName: PropTypes.string,
  done: PropTypes.bool,
  input: PropTypes.object,
};

// ----------------------------------------------------------------------

function ImageCarousel({ images }) {
  const [index, setIndex] = useState(0);
  const count = images.length;
  const go = (delta) => setIndex((p) => (p + delta + count) % count);

  const arrowSx = (side) => ({
    position: 'absolute',
    top: '50%',
    [side]: 8,
    transform: 'translateY(-50%)',
    bgcolor: 'rgba(0,0,0,0.45)',
    color: 'common.white',
    '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
  });

  return (
    <Box sx={{ position: 'relative', mb: 1 }}>
      <Box
        component="img"
        src={images[index]}
        alt=""
        sx={{ width: 1, maxHeight: 220, objectFit: 'cover', borderRadius: 1, display: 'block' }}
      />
      {count > 1 && (
        <>
          <IconButton size="small" onClick={() => go(-1)} sx={arrowSx('left')}>
            <Iconify icon="eva:arrow-ios-back-fill" />
          </IconButton>
          <IconButton size="small" onClick={() => go(1)} sx={arrowSx('right')}>
            <Iconify icon="eva:arrow-ios-forward-fill" />
          </IconButton>
          <Stack
            direction="row"
            spacing={0.5}
            justifyContent="center"
            sx={{ position: 'absolute', bottom: 8, left: 0, right: 0 }}
          >
            {images.map((img, i) => (
              <Box
                key={`${img}-${i}`}
                onClick={() => setIndex(i)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  bgcolor: i === index ? 'common.white' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
}

ImageCarousel.propTypes = { images: PropTypes.arrayOf(PropTypes.string) };

// ----------------------------------------------------------------------

export function ToolFieldForm({ input, disabled, submitted, onSubmit }) {
  const { t } = useTranslate();
  const fields = input?.fields ?? [];
  // Seed each field with any AI-suggested value so the merchant sees a proposal
  // (e.g. a generated product name) they can accept or tweak — never a blank ask.
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value ?? '']))
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

  const numeric = (kind) => kind === 'number' || kind === 'price' || kind === 'integer';
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
          {t('assistant.send')}
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
  const { t } = useTranslate();
  const images = input?.images ?? (input?.image_url ? [input.image_url] : []);

  return (
    <Paper elevation={0} sx={cardSx}>
      {input?.title && (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>{input.title}</Typography>
      )}

      {images.length > 0 && <ImageCarousel images={images} />}

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
          label={decision === 'approved' ? t('assistant.approved') : t('assistant.changes_requested')}
        />
      ) : (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button variant="contained" size="small" color="success" disabled={disabled} onClick={onApprove}>
            {t('assistant.approve')}
          </Button>
          <Button variant="outlined" size="small" disabled={disabled} onClick={onRequestChanges}>
            {t('assistant.request_changes')}
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
