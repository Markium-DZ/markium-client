import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { useTranslate } from 'src/locales';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const PAYMENT_OPTIONS = [
  {
    value: 'edahabia',
    label: 'Edahabia',
    icon: 'emojione:credit-card',
  },
  {
    value: 'cib',
    label: 'CIB',
    icon: 'emojione:credit-card',
  },
];

// ----------------------------------------------------------------------

export default function SubscriptionPaymentMethods({ value, onChange }) {
  const { t } = useTranslate();

  return (
    <Stack spacing={3}>
      <Typography variant="h6">{t('select_payment_method')}</Typography>

      <Stack spacing={2}>
        {PAYMENT_OPTIONS.map((option) => (
          <Paper
            key={option.value}
            variant="outlined"
            onClick={() => onChange(option.value)}
            sx={{
              p: 2.5,
              cursor: 'pointer',
              ...(value === option.value && {
                boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
              }),
            }}
          >
            <ListItemText
              primary={
                <Stack direction="row" alignItems="center">
                  <Iconify
                    icon={value === option.value ? 'eva:checkmark-circle-2-fill' : 'eva:radio-button-off-fill'}
                    width={24}
                    sx={{
                      mr: 2,
                      color: value === option.value ? 'primary.main' : 'text.secondary',
                    }}
                  />

                  <Box component="span" sx={{ flexGrow: 1 }}>
                    {option.label}
                  </Box>

                  <Iconify icon={option.icon} width={32} />
                </Stack>
              }
              primaryTypographyProps={{ typography: 'subtitle2' }}
            />
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}

SubscriptionPaymentMethods.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
};
