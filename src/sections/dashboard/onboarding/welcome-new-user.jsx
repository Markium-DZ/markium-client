import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { bgGradient } from 'src/theme/css';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function WelcomeNewUser({ userName, productsCount = 0, img, ...other }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const isNewUser = productsCount === 0;

  return (
    <Stack
      flexDirection={{ xs: 'column', md: 'row' }}
      sx={{
        ...bgGradient({
          direction: '135deg',
          startColor: alpha(theme.palette.primary.light, 0.2),
          endColor: alpha(theme.palette.primary.main, 0.2),
        }),
        height: '100%',
        borderRadius: 2,
        position: 'relative',
        color: 'primary.darker',
        backgroundColor: 'common.white',
      }}
      {...other}
    >
      <Stack
        flexGrow={1}
        justifyContent="center"
        alignItems={{ xs: 'center', md: 'flex-start' }}
        sx={{
          p: {
            xs: theme.spacing(3, 2.5, 0, 2.5),
            md: theme.spacing(3),
          },
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        {isNewUser ? (
          <>
            <Typography variant="h4" sx={{ mb: 0.5, whiteSpace: 'pre-line' }}>
              {t('welcome_new_user_title')} {userName}! 👋
            </Typography>

            <Typography
              variant="body2"
              sx={{
                opacity: 0.8,
                maxWidth: 400,
                mb: { xs: 2, md: 0 },
              }}
            >
              {t('welcome_new_user_subtitle')}
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h4" sx={{ mb: 1, whiteSpace: 'pre-line' }}>
              {t('welcome_back')} {userName}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                opacity: 0.8,
                maxWidth: 360,
                mb: { xs: 2, xl: 3 },
              }}
            >
              {t('manage_store_description')}
            </Typography>

            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push(paths.dashboard.order.root)}
            >
              {t('view_orders')}
            </Button>
          </>
        )}
      </Stack>

      {img && (
        <Stack
          component="span"
          justifyContent="center"
          sx={{
            p: { xs: 3, md: 2 },
            maxWidth: 280,
            mx: 'auto',
          }}
        >
          {img}
        </Stack>
      )}
    </Stack>
  );
}

WelcomeNewUser.propTypes = {
  userName: PropTypes.string,
  productsCount: PropTypes.number,
  img: PropTypes.node,
};
