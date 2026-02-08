import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export default function ConnectionError({ onRetry, title, description, sx }) {
  const { t } = useTranslate();

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 3,
        py: 10,
        ...sx,
      }}
    >
      <Stack spacing={2.5} alignItems="center" sx={{ maxWidth: 480 }}>
        <Typography
          variant="h3"
          sx={{ color: 'text.disabled', fontWeight: 700 }}
        >
          {title || t('connection_error_title')}
        </Typography>

        <Typography
          variant="body1"
          sx={{ color: 'text.disabled', lineHeight: 1.7 }}
        >
          {description || t('connection_error_description')}
        </Typography>

        {onRetry && (
          <Button
            variant="text"
            color="inherit"
            onClick={onRetry}
            sx={{
              mt: 1,
              color: 'text.disabled',
              fontWeight: 600,
              textDecoration: 'underline',
              '&:hover': { textDecoration: 'underline', color: 'text.secondary' },
            }}
          >
            {t('retry')}
          </Button>
        )}
      </Stack>
    </Box>
  );
}

ConnectionError.propTypes = {
  onRetry: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.string,
  sx: PropTypes.object,
};
