import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function InventoryDetailsToolbar({
  backLink,
  inventoryItem,
  onOpenAdjustment,
}) {
  const { t } = useTranslate();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Stack
      spacing={3}
      direction={{ xs: 'column', md: 'row' }}
      sx={{
        mb: { xs: 2, md: 5 },
      }}
    >
      <Stack spacing={1} direction="row" alignItems="flex-start" sx={{ flexGrow: 1 }}>
        {!isMobile && (
          <IconButton component={RouterLink} href={backLink}>
            <Iconify icon="eva:arrow-ios-back-fill" />
          </IconButton>
        )}

        <Stack spacing={0.5}>
          <Typography variant="h4">{inventoryItem?.product?.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('sku')}: {inventoryItem?.sku}
          </Typography>
        </Stack>
      </Stack>

      <Stack
        flexShrink={0}
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ alignSelf: 'flex-start' }}
      >
        <Button
          color="inherit"
          variant="outlined"
          startIcon={<Iconify icon="solar:box-bold" />}
          onClick={() => router.push(paths.dashboard.inventory.items(inventoryItem?.id))}
        >
          {t('view_items')}
        </Button>

        <Button
          color="inherit"
          variant="outlined"
          startIcon={<Iconify icon="solar:history-bold" />}
          onClick={() => router.push(paths.dashboard.inventory.tracking(inventoryItem?.id))}
        >
          {t('view_tracking')}
        </Button>

        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:slider-vertical-bold" />}
          onClick={onOpenAdjustment}
        >
          {t('adjust')}
        </Button>
      </Stack>
    </Stack>
  );
}

InventoryDetailsToolbar.propTypes = {
  backLink: PropTypes.string,
  inventoryItem: PropTypes.object,
  onOpenAdjustment: PropTypes.func,
};
