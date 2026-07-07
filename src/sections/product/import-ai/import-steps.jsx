import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useTranslate } from 'src/locales';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const STEP_LABEL_KEYS = {
  read_post: 'assistant.import_step_read_post',
  collect_images: 'assistant.import_step_collect_images',
  analyze: 'assistant.import_step_analyze',
  publish: 'assistant.import_step_publish',
};

function StatusIcon({ status }) {
  if (status === 'running') return <CircularProgress size={16} />;
  if (status === 'done') return <Iconify icon="eva:checkmark-fill" width={18} sx={{ color: 'success.main' }} />;
  if (status === 'warn') return <Iconify icon="eva:alert-triangle-fill" width={18} sx={{ color: 'warning.main' }} />;
  if (status === 'error') return <Iconify icon="eva:close-fill" width={18} sx={{ color: 'error.main' }} />;
  return <Iconify icon="eva:radio-button-off-outline" width={18} sx={{ color: 'text.disabled' }} />;
}

StatusIcon.propTypes = { status: PropTypes.string };

/**
 * Renders the import checklist. `events` is the raw stream; the LAST event per
 * step wins, and steps not seen yet render as pending (grey circle).
 */
export default function ImportSteps({ events, steps }) {
  const { t } = useTranslate();
  const latest = {};
  events.forEach((event) => {
    if (STEP_LABEL_KEYS[event.step]) latest[event.step] = event;
  });

  return (
    <Stack spacing={1}>
      {steps.map((step) => {
        const event = latest[step];
        const status = event?.status ?? 'pending';
        let detail = '';
        if (step === 'collect_images' && status === 'warn') {
          detail = t('assistant.import_step_collect_images_warn');
        } else if (step === 'collect_images' && event?.meta?.count) {
          detail = t('assistant.import_images_count', { count: event.meta.count });
        }
        return (
          <Stack key={step} direction="row" alignItems="center" spacing={1.5}>
            <StatusIcon status={status} />
            <Typography variant="body2" sx={{ color: status === 'pending' ? 'text.disabled' : 'text.primary' }}>
              {t(STEP_LABEL_KEYS[step])}
              {detail ? ` — ${detail}` : ''}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}

ImportSteps.propTypes = {
  events: PropTypes.array.isRequired,
  steps: PropTypes.array.isRequired,
};
