import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { useTranslate } from 'src/locales';

import { fCurrency } from 'src/utils/format-number';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export default function OrderDetailsItems({
  items,
  shipping,
  discount,
  subTotal,
  totalAmount,
}) {
  const { t } = useTranslate();

  const renderTotal = (
    <Stack
      spacing={2}
      alignItems="flex-end"
      sx={{ my: 3, textAlign: 'end', typography: 'body2' }}
    >
      <Stack direction="row">
        <Box sx={{ color: 'text.secondary' }}>{t('subtotal')}</Box>
        <Box sx={{ width: 160, typography: 'subtitle2' }}>{fCurrency(subTotal) || '-'}</Box>
      </Stack>

      <Stack direction="row">
        <Box sx={{ color: 'text.secondary' }}>{t('shipping')}</Box>
        <Box
          sx={{
            width: 160,
            ...(shipping && { color: 'success.main' }),
          }}
        >
          {shipping ? fCurrency(shipping) : '-'}
        </Box>
      </Stack>

      <Stack direction="row">
        <Box sx={{ color: 'text.secondary' }}>{t('discount')}</Box>
        <Box
          sx={{
            width: 160,
            ...(discount && { color: 'error.main' }),
          }}
        >
          {discount ? `- ${fCurrency(discount)}` : '-'}
        </Box>
      </Stack>

      <Stack direction="row" sx={{ typography: 'subtitle1' }}>
        <Box>{t('total')}</Box>
        <Box sx={{ width: 160 }}>{fCurrency(totalAmount) || '-'}</Box>
      </Stack>
    </Stack>
  );

  return (
    <Card>
      <CardHeader
        title={t('details')}
      />

      <Stack
        sx={{
          px: 3,
        }}
      >
        {/* <Scrollbar> */}
          {items?.map((item) => {
            // Handle media as array or single object
            const mediaArray = Array.isArray(item.variant?.media)
              ? item.variant.media
              : (item.variant?.media ? [item.variant.media] : []);
            const mediaUrl = mediaArray.length > 0 ? (mediaArray[0]?.full_url || mediaArray[0]?.url || null) : null;
            const variantOptions = item.variant?.options || [];

            return (
              <Stack
                key={item.id}
                direction="row"
                alignItems="center"
                sx={{
                  py: 3,
                  // minWidth: 640,
                  borderBottom: (theme) => `dashed 2px ${theme.palette.background.neutral}`,
                }}
              >
                <Avatar src={mediaUrl} variant="rounded" sx={{ width: 48, height: 48, mr: 2 }} />

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {item.product?.name}
                  </Typography>

                  {variantOptions.length > 0 && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                      {variantOptions.map((opt, idx) => (
                        <Chip
                          key={idx}
                          size="small"
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {opt.color_hex && (
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: '50%',
                                    bgcolor: opt.color_hex,
                                    border: (theme) => `1px solid ${theme.palette.divider}`,
                                  }}
                                />
                              )}
                              <Typography variant="caption">
                                {opt.definition_name}: {opt.value}
                              </Typography>
                            </Box>
                          }
                          sx={{ height: 20 }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>

                <Box sx={{ typography: 'body2', mx: 2 }}>×{item.quantity}</Box>

                <Box sx={{ width: 110, textAlign: 'end', typography: 'subtitle2' }}>
                  {fCurrency(item.unit_price)}
                </Box>
              </Stack>
            );
          })}
        {/* </Scrollbar> */}

        {renderTotal}
      </Stack>
    </Card>
  );
}

OrderDetailsItems.propTypes = {
  discount: PropTypes.number,
  items: PropTypes.array,
  shipping: PropTypes.number,
  subTotal: PropTypes.number,
  totalAmount: PropTypes.number,
};
