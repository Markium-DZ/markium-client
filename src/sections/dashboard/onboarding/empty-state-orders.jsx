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

export default function EmptyStateOrders({ hasProducts = false, sx, ...other }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const tips = [
    {
      icon: 'solar:share-bold',
      text: t('empty_orders_tip1'),
    },
    {
      icon: 'solar:gallery-bold',
      text: t('empty_orders_tip2'),
    },
    {
      icon: 'solar:refresh-bold',
      text: t('empty_orders_tip3'),
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
            bgcolor: alpha(theme.palette.warning.main, 0.08),
            color: 'warning.main',
          }}
        >
          <Iconify icon="solar:bag-smile-bold" width={40} />
        </Box>

        {/* Title & Description */}
        <Stack spacing={1}>
          <Typography variant="h6">{t('empty_orders_title')}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
            {hasProducts ? t('empty_orders_description_with_products') : t('empty_orders_description_no_products')}
          </Typography>
        </Stack>

        {/* Tips Section */}
        {hasProducts && (
          <Stack spacing={2} sx={{ width: '100%', maxWidth: 400 }}>
            <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
              {t('empty_orders_tips_title')}
            </Typography>
            {tips.map((tip, index) => (
              <Stack
                key={index}
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: 'background.paper',
                  border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                  textAlign: 'start',
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                    flexShrink: 0,
                  }}
                >
                  <Iconify icon={tip.icon} width={20} />
                </Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {tip.text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {/* Action Buttons */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {hasProducts ? (
            <>
              <Button
                variant="contained"
                size="large"
                startIcon={<Iconify icon="solar:copy-bold" />}
                onClick={() => {}}
              >
                {t('empty_orders_copy_link')}
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Iconify icon="solar:chart-bold" />}
                onClick={() => {}}
              >
                {t('empty_orders_marketing_tips')}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              size="large"
              startIcon={<Iconify icon="solar:box-add-bold" />}
              onClick={() => router.push(paths.dashboard.product.new)}
            >
              {t('empty_orders_create_product')}
            </Button>
          )}
        </Stack>

        {/* Encouragement Message */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.success.main, 0.08),
          }}
        >
          <Iconify icon="solar:star-bold" sx={{ color: 'success.main', fontSize: 18 }} />
          <Typography variant="caption" sx={{ color: 'success.dark' }}>
            {t('empty_orders_encouragement')}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}

EmptyStateOrders.propTypes = {
  hasProducts: PropTypes.bool,
  sx: PropTypes.object,
};
