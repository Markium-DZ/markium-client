import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
// import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { useTranslate } from 'src/locales';

import { fCurrency } from 'src/utils/format-number';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function OrderDetailsItems({
  items,
  shipping,
  discount,
  subTotal,
  totalAmount,
}) {
  const { t } = useTranslate();

  return (
    <Card>
      <Accordion
        defaultExpanded={false}
        disableGutters
        sx={{
          boxShadow: 'none',
          '&:before': { display: 'none' },
          bgcolor: 'transparent',
        }}
      >
        <AccordionSummary
          expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
          sx={{
            px: 3,
            py: 0,
            alignItems: 'flex-start',
            '& .MuiAccordionSummary-content': {
              my: 0,
              flexDirection: 'column',
            },
            '& .MuiAccordionSummary-expandIconWrapper': {
              mt: 2.5,
            },
          }}
        >
          <Typography variant="h6" sx={{ pt: 2, pb: 1 }}>{t('details')}</Typography>

          {items?.map((item) => {
            const mediaArray = Array.isArray(item.variant?.media)
              ? item.variant.media
              : (item.variant?.media ? [item.variant.media] : []);
            const mediaUrl = mediaArray.length > 0 ? (mediaArray[0]?.full_url || mediaArray[0]?.url || null) : null;
            const variantOptions = item.variant?.options || [];
            const optionsText = variantOptions.map((opt) => opt.value).filter(Boolean).join('  |  ');

            return (
              <Stack
                key={item.id}
                direction="row"
                alignItems="center"
                sx={{
                  py: 2,
                  width: 1,
                  borderBottom: (theme) => `dashed 1px ${theme.palette.divider}`,
                }}
              >
                <Box
                  component="img"
                  src={mediaUrl}
                  alt={item.product?.name}
                  sx={{
                    width: 64,
                    height: 64,
                    flexShrink: 0,
                    objectFit: 'cover',
                    borderRadius: 1.5,
                    bgcolor: 'background.neutral',
                    mr: 2,
                  }}
                />

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {item.product?.name}
                  </Typography>

                  {optionsText && (
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 0.25, display: 'block' }}>
                      {optionsText}
                    </Typography>
                  )}
                </Box>

                <Stack alignItems="flex-end" sx={{ flexShrink: 0, ml: 2 }}>
                  <Typography variant="subtitle2">
                    {fCurrency(item.unit_price)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('quantity')}: {item.quantity}
                  </Typography>
                </Stack>
              </Stack>
            );
          })}
        </AccordionSummary>

        <AccordionDetails sx={{ px: 3, pt: 0, pb: 2 }}>
          <Stack
            spacing={1.5}
            alignItems="flex-end"
            sx={{ mt: 1, textAlign: 'end', typography: 'body2' }}
          >
            <Stack direction="row">
              <Box sx={{ color: 'text.secondary' }}>{t('subtotal')}</Box>
              <Box sx={{ width: 160, typography: 'subtitle2' }}>{fCurrency(subTotal) || '-'}</Box>
            </Stack>

            <Stack direction="row">
              <Box sx={{ color: 'text.secondary' }}>{t('shipping')}</Box>
              <Box sx={{ width: 160, ...(shipping && { color: 'success.main' }) }}>
                {shipping ? fCurrency(shipping) : '-'}
              </Box>
            </Stack>

            <Stack direction="row">
              <Box sx={{ color: 'text.secondary' }}>{t('discount')}</Box>
              <Box sx={{ width: 160, ...(discount && { color: 'error.main' }) }}>
                {discount ? `- ${fCurrency(discount)}` : '-'}
              </Box>
            </Stack>

            <Stack direction="row" sx={{ typography: 'subtitle1' }}>
              <Box>{t('total')}</Box>
              <Box sx={{ width: 160 }}>{fCurrency(totalAmount) || '-'}</Box>
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>
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
