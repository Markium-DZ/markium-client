import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

function CountBadge({ count, contained }) {
  if (count === undefined || count === null) return null;
  return (
    <Box
      component="span"
      sx={{
        ml: 0.75,
        px: 0.75,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        typography: 'caption',
        fontWeight: 700,
        lineHeight: '20px',
        textAlign: 'center',
        bgcolor: contained ? 'rgba(255,255,255,0.24)' : 'primary.lighter',
        color: contained ? 'inherit' : 'primary.darker',
      }}
    >
      {count}
    </Box>
  );
}

CountBadge.propTypes = {
  count: PropTypes.number,
  contained: PropTypes.bool,
};

// ----------------------------------------------------------------------

/**
 * One action of the orders selection bar.
 * Desktop: a regular button with a count badge ("Ship 2").
 * Phone (compact): icon above a short label, sized for thumbs.
 * `count` = how many of the selected orders the action applies to; 0 disables it
 * and the tooltip (`disabledHint`) says why.
 */
export default function SelectionActionButton({
  icon,
  label,
  count,
  onClick,
  loading = false,
  primary = false,
  compact = false,
  disabledHint,
}) {
  const disabled = count === 0;

  const button = compact ? (
    <ButtonBase
      onClick={onClick}
      disabled={disabled || loading}
      sx={{
        flex: 1,
        minWidth: 0,
        py: 0.75,
        borderRadius: 1.5,
        flexDirection: 'column',
        gap: 0.25,
        color: primary ? 'primary.main' : 'text.primary',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <Iconify icon={loading ? 'svg-spinners:ring-resize' : icon} width={22} />
        {!!count && (
          <Box
            component="span"
            sx={{
              position: 'absolute',
              top: -6,
              insetInlineEnd: -12,
              px: 0.5,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '16px',
              textAlign: 'center',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            {count}
          </Box>
        )}
      </Box>
      <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 1 }}>
        {label}
      </Typography>
    </ButtonBase>
  ) : (
    <LoadingButton
      variant={primary ? 'contained' : 'outlined'}
      color={primary ? 'primary' : 'inherit'}
      loading={loading}
      disabled={disabled}
      onClick={onClick}
      startIcon={<Iconify icon={icon} />}
    >
      {label}
      <CountBadge count={count} contained={primary} />
    </LoadingButton>
  );

  if (disabled && disabledHint) {
    return (
      <Tooltip title={disabledHint}>
        <Box component="span" sx={{ display: 'flex', flex: compact ? 1 : 'none' }}>
          {button}
        </Box>
      </Tooltip>
    );
  }

  return button;
}

SelectionActionButton.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  count: PropTypes.number,
  onClick: PropTypes.func,
  loading: PropTypes.bool,
  primary: PropTypes.bool,
  compact: PropTypes.bool,
  disabledHint: PropTypes.string,
};
