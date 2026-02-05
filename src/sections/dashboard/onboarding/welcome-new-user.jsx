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
        height: { md: 1 },
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
            xs: theme.spacing(5, 3, 0, 3),
            md: theme.spacing(5),
          },
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        {isNewUser ? (
          <>
            <Typography variant="h4" sx={{ mb: 1, whiteSpace: 'pre-line' }}>
              {t('welcome_new_user_title')} {userName}! 👋
            </Typography>

            <Typography
              variant="body1"
              sx={{
                opacity: 0.8,
                maxWidth: 400,
                mb: 2,
              }}
            >
              {t('welcome_new_user_subtitle')}
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ mb: { xs: 3, md: 0 } }}
            >
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<Iconify icon="solar:box-add-bold" />}
                onClick={() => router.push(paths.dashboard.product.new)}
              >
                {t('welcome_create_first_product')}
              </Button>

              <Button
                variant="outlined"
                color="inherit"
                size="large"
                startIcon={<Iconify icon="solar:gallery-add-bold" />}
                onClick={() => router.push(paths.dashboard.media.root)}
                sx={{
                  borderColor: alpha(theme.palette.primary.main, 0.5),
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                {t('welcome_upload_images')}
              </Button>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.info.main, 0.08),
                display: { xs: 'none', md: 'flex' },
              }}
            >
              <Iconify icon="solar:lightbulb-bolt-bold" sx={{ color: 'info.main' }} />
              <Typography variant="caption" sx={{ color: 'info.dark' }}>
                {t('welcome_tip_upload_first')}
              </Typography>
            </Stack>
          </>
        ) : (
          <>
            <Typography variant="h4" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
              {t('welcome_back')} {userName}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                opacity: 0.8,
                maxWidth: 360,
                mb: { xs: 3, xl: 5 },
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
            p: { xs: 5, md: 3 },
            maxWidth: 360,
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
