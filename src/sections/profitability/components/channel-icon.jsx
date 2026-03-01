import PropTypes from 'prop-types';
import { Stack, Typography } from '@mui/material';
import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';
import { CHANNEL_ICONS } from '../constants';

// ----------------------------------------------------------------------

export default function ChannelIcon({ channel, showLabel = true }) {
  const { t } = useTranslate();
  const icon = CHANNEL_ICONS[channel] || CHANNEL_ICONS.other;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Iconify icon={icon} width={20} />
      {showLabel && (
        <Typography variant="body2">{t(`channel_${channel}`)}</Typography>
      )}
    </Stack>
  );
}

ChannelIcon.propTypes = {
  channel: PropTypes.string.isRequired,
  showLabel: PropTypes.bool,
};
