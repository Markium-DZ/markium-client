import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function EmptyStateProducts({ sx, ...other }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const steps = [
    {
      number: 1,
      title: t('empty_products_step1'),
      icon: 'solar:gallery-add-bold',
    },
    {
      number: 2,
      title: t('empty_products_step2'),
      icon: 'solar:document-add-bold',
    },
    {
      number: 3,
      title: t('empty_products_step3'),
      icon: 'solar:shop-bold',
    },
  ];

  return (
    <Card
      sx={{
        p: 4,
        textAlign: 'center',
        bgcolor: alpha(theme.palette.grey[500], 0.04),
        border: `dashed 1px ${alpha(theme.palette.grey[500], 0.2)}`,
        ...sx,
      }}
      {...other}
    >
      <Stack spacing={3} alignItems="center">
        {/* Icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: 'primary.main',
          }}
        >
          <Iconify icon="solar:box-bold" width={40} />
        </Box>

        {/* Title & Description */}
        <Stack spacing={1}>
          <Typography variant="h6">{t('empty_products_title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
            {t('empty_products_description')}
          </Typography>
        </Stack>

        {/* Steps */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2, sm: 0 }}
          justifyContent="center"
          alignItems="center"
          sx={{ width: '100%', maxWidth: 700 }}
        >
          {steps.map((step, index) => (
            <Stack
              key={step.number}
              direction="row"
              alignItems="center"
              sx={{ flex: 1 }}
            >
              {/* Step Card */}
              <Stack
                alignItems="center"
                spacing={1.5}
                sx={{
                  flex: 1,
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  boxShadow: `0 2px 8px ${alpha(theme.palette.grey[500], 0.08)}`,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                  },
                }}
              >
                {/* Step Number Badge */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    color: 'common.white',
                    fontWeight: 'bold',
                    fontSize: 16,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                  }}
                >
                  {step.number}
                </Box>

                {/* Icon with Background */}
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  }}
                >
                  <Iconify icon={step.icon} width={28} sx={{ color: 'primary.main' }} />
                </Box>

                {/* Step Title */}
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: 'text.primary',
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  {step.title}
                </Typography>
              </Stack>

              {/* Connector Arrow - respects RTL/LTR direction */}
              {index < steps.length - 1 && (
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    }}
                  >
                    <Iconify
                      icon={theme.direction === 'rtl' ? 'solar:arrow-left-bold' : 'solar:arrow-right-bold'}
                      width={18}
                      sx={{ color: 'primary.main' }}
                    />
                  </Box>
                </Box>
              )}
            </Stack>
          ))}
        </Stack>

        {/* Action Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Iconify icon="solar:box-add-bold" />}
            onClick={() => router.push(paths.dashboard.product.new)}
          >
            {t('empty_products_create_button')}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Iconify icon="solar:play-circle-bold" />}
            onClick={() => {}}
          >
            {t('empty_products_watch_tutorial')}
          </Button>
        </Stack>

        {/* Tip */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.info.main, 0.08),
          }}
        >
          <Iconify icon="solar:clock-circle-bold" sx={{ color: 'info.main', fontSize: 18 }} />
          <Typography variant="caption" sx={{ color: 'info.dark' }}>
            {t('empty_products_time_tip')}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}

EmptyStateProducts.propTypes = {
  sx: PropTypes.object,
};
