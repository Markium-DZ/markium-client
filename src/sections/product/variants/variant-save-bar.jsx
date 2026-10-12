import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { useTranslate } from 'src/locales';
import { NAV_HEIGHT } from 'src/layouts/dashboard/bottom-nav';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

/** Sticky "N unsaved changes — Discard / Save" bar, sits above the mobile bottom nav. */
export default function VariantSaveBar({ count, saving, progress, hasErrors, onSave, onDiscard }) {
  const { t } = useTranslate();

  if (!count) return null;

  return (
    <Box
      sx={{
        position: 'sticky',
        zIndex: (theme) => theme.zIndex.appBar - 1,
        bottom: {
          xs: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom) + 8px)`,
          lg: 16,
        },
        mt: 2,
      }}
    >
      <Card
        sx={{
          px: { xs: 1.5, sm: 2.5 },
          py: 1.25,
          bgcolor: 'grey.800',
          color: 'common.white',
          boxShadow: (theme) => theme.customShadows?.z20 || theme.shadows[12],
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {saving
                ? t('variants_saving_progress', { done: progress.done, total: progress.total })
                : t('variants_unsaved_changes', { count })}
            </Typography>
            {hasErrors && !saving && (
              <Typography variant="caption" sx={{ color: 'error.light' }}>
                {t('variants_fix_errors')}
              </Typography>
            )}
          </Stack>

          <Button size="small" color="inherit" disabled={saving} onClick={onDiscard} sx={{ color: 'grey.400' }}>
            {t('discard')}
          </Button>

          <LoadingButton
            size="small"
            variant="contained"
            color="primary"
            loading={saving}
            disabled={hasErrors}
            onClick={onSave}
            startIcon={<Iconify icon="solar:diskette-bold" width={18} />}
          >
            {t('variants_save_n_changes', { count })}
          </LoadingButton>
        </Stack>
      </Card>
    </Box>
  );
}

VariantSaveBar.propTypes = {
  count: PropTypes.number,
  saving: PropTypes.bool,
  progress: PropTypes.shape({ done: PropTypes.number, total: PropTypes.number }),
  hasErrors: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onDiscard: PropTypes.func.isRequired,
};
