import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { fCurrency } from 'src/utils/format-number';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function OrderMobileCard({ row, onActionsClick }) {
  const router = useRouter();
  const items = row.items || [];
  const firstItem = items[0];

  // Get image from first item's variant media
  let imageUrl = '';
  if (firstItem?.variant?.media) {
    const mediaArray = Array.isArray(firstItem.variant.media)
      ? firstItem.variant.media
      : [firstItem.variant.media];
    if (mediaArray.length > 0) {
      imageUrl = mediaArray[0]?.full_url || mediaArray[0]?.url || '';
    }
  }

  return (
    <Card
      sx={{ p: 1.5, mb: 1, cursor: 'pointer' }}
      onClick={() => router.push(paths.dashboard.order.details(row.id))}
    >
      <Stack direction="row" spacing={1.5}>
        {/* Product thumbnail */}
        {imageUrl ? (
          <Avatar
            src={imageUrl}
            variant="rounded"
            sx={{ width: 52, height: 52, flexShrink: 0 }}
          />
        ) : (
          <Avatar
            variant="rounded"
            sx={{ width: 52, height: 52, flexShrink: 0, bgcolor: 'grey.200' }}
          >
            <Iconify icon="solar:bag-4-bold" width={24} sx={{ color: 'grey.500' }} />
          </Avatar>
        )}

        {/* Order info */}
        <Stack sx={{ flexGrow: 1, minWidth: 0 }} spacing={0.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack spacing={0.25} sx={{ minWidth: 0, flexGrow: 1, mr: 1 }}>
              <Typography variant="subtitle2" noWrap>
                {row.name || '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {row.phone || '-'}
              </Typography>
            </Stack>

            {/* Actions (three dots) */}
            {row.actions && (
              <Box sx={{ flexShrink: 0 }}>
                {row.actions(() => {})}
              </Box>
            )}
          </Stack>

          {/* Price + Status row */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="subtitle2" color="primary.main">
              {row.total || '-'}
            </Typography>

            <Label
              variant="soft"
              color={row.color || 'default'}
              sx={{ height: 22, fontSize: 11 }}
            >
              {row.c_status || '-'}
            </Label>

            {items.length > 1 && (
              <Typography variant="caption" color="text.secondary">
                {items.length} items
              </Typography>
            )}
          </Stack>

          {/* Address */}
          {row.full_address && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {row.full_address}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

OrderMobileCard.propTypes = {
  row: PropTypes.object,
  onActionsClick: PropTypes.func,
};
