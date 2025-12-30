import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function QuickActionsPanel({ sx, ...other }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const actions = [
    {
      id: 'upload_media',
      title: t('quick_action_upload_images'),
      description: t('quick_action_upload_images_desc'),
      icon: 'solar:gallery-add-bold',
      color: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.08),
      path: paths.dashboard.media.root,
    },
    {
      id: 'add_product',
      title: t('quick_action_add_product'),
      description: t('quick_action_add_product_desc'),
      icon: 'solar:box-add-bold',
      color: theme.palette.primary.main,
      bgColor: alpha(theme.palette.primary.main, 0.08),
      path: paths.dashboard.product.new,
    },
    {
      id: 'view_orders',
      title: t('quick_action_view_orders'),
      description: t('quick_action_view_orders_desc'),
      icon: 'solar:bag-4-bold',
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.08),
      path: paths.dashboard.order.root,
    },
    {
      id: 'inventory',
      title: t('quick_action_inventory'),
      description: t('quick_action_inventory_desc'),
      icon: 'solar:box-minimalistic-bold',
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.08),
      path: paths.dashboard.inventory.root,
    },
    {
      id: 'settings',
      title: t('quick_action_settings'),
      description: t('quick_action_settings_desc'),
      icon: 'solar:settings-bold',
      color: theme.palette.grey[600],
      bgColor: alpha(theme.palette.grey[500], 0.08),
      path: paths.dashboard.settings.root,
    },
    {
      id: 'support',
      title: t('quick_action_support'),
      description: t('quick_action_support_desc'),
      icon: 'solar:chat-round-dots-bold',
      color: theme.palette.error.main,
      bgColor: alpha(theme.palette.error.main, 0.08),
      path: paths.dashboard.settings.contact_support,
    },
  ];

  return (
    <Card sx={{ p: 3, ...sx }} {...other}>
      <Typography variant="h6" sx={{ mb: 3 }}>
        {t('quick_actions')}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
          },
        }}
      >
        {actions.map((action) => (
          <ButtonBase
            key={action.id}
            onClick={() => router.push(action.path)}
            sx={{
              p: 2,
              borderRadius: 1.5,
              textAlign: 'center',
              flexDirection: 'column',
              bgcolor: action.bgColor,
              border: `1px solid ${alpha(action.color, 0.16)}`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: alpha(action.color, 0.16),
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${alpha(action.color, 0.24)}`,
              },
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(action.color, 0.16),
                color: action.color,
                mb: 1.5,
              }}
            >
              <Iconify icon={action.icon} width={26} />
            </Box>
            <Typography variant="subtitle2" sx={{ color: 'text.primary', mb: 0.25 }}>
              {action.title}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}
            >
              {action.description}
            </Typography>
          </ButtonBase>
        ))}
      </Box>
    </Card>
  );
}

QuickActionsPanel.propTypes = {
  sx: PropTypes.object,
};
