import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

export default function SubscriptionPackageCard({ packageData, selected, onClick }) {
  const { t } = useTranslate();

  const { name, slug, price, currency, billing_cycle } = packageData;

  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 3,
        cursor: 'pointer',
        position: 'relative',
        ...(selected && {
          boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
        }),
      }}
    >
      {selected && (
        <Iconify
          icon="eva:checkmark-circle-2-fill"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: 'primary.main',
          }}
        />
      )}

      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6">{name}</Typography>
          {billing_cycle && (
            <Label color="info" variant="soft">
              {t(billing_cycle)}
            </Label>
          )}
        </Stack>

        <Stack direction="row" alignItems="baseline" spacing={0.5}>
          <Typography variant="h3">
            {fCurrency(price)}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {currency?.toUpperCase() || 'DZD'}
          </Typography>
          {billing_cycle && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              / {t(billing_cycle)}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

SubscriptionPackageCard.propTypes = {
  packageData: PropTypes.shape({
    name: PropTypes.string,
    slug: PropTypes.string,
    price: PropTypes.number,
    currency: PropTypes.string,
    billing_cycle: PropTypes.string,
  }),
  selected: PropTypes.bool,
  onClick: PropTypes.func,
};
