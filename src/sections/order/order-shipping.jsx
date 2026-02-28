import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';

import Iconify from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

export default function OrderShipping({ quotesGroupedByProvider, loading, error, onRefresh, onSelect, selectedQuoteId, onShip }) {
  const { t } = useTranslate();

  const hasQuotes = quotesGroupedByProvider && Object.keys(quotesGroupedByProvider).length > 0;

  if (loading) {
    return (
      <Card>
        <CardHeader title={t('shipping')} />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <LoadingScreen />
        </Box>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title={t('shipping')} />
        <Alert severity="error" sx={{ m: 2 }}>
          <Typography variant="body2">
            {t('error_loading_shipping')}
          </Typography>
        </Alert>
      </Card>
    );
  }

  if (!hasQuotes) {
    return (
      <Card>
        <CardHeader
          title={t('shipping')}
          action={
            onRefresh && (
              <Button
                size="small"
                startIcon={<Iconify icon="eva:refresh-fill" />}
                onClick={onRefresh}
              >
                {t('refresh')}
              </Button>
            )
          }
        />
        <Alert severity="info" sx={{ m: 2 }}>
          <Typography variant="body2">
            {t('no_shipping_available')}
          </Typography>
          <Button
            component={RouterLink}
            href={paths.dashboard.settings.delivery_companies}
            size="small"
            variant="outlined"
            color="info"
            startIcon={<Iconify icon="solar:settings-bold-duotone" width={18} />}
            sx={{ mt: 1 }}
          >
            {t('integrate_shipping_company')}
          </Button>
        </Alert>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={t('shipping')}
        action={
          onRefresh && (
            <Button
              size="small"
              startIcon={<Iconify icon="eva:refresh-fill" />}
              onClick={onRefresh}
            >
              {t('refresh')}
            </Button>
          )
        }
      />

      {/* Contextual guidance */}
      <Alert
        severity="info"
        icon={<Iconify icon="solar:delivery-bold" width={22} />}
        sx={{ mx: 2, mt: 1 }}
      >
        {t('select_delivery_provider')}
      </Alert>

      {/* Quotes List Grouped by Provider */}
      <Box sx={{ p: 3 }}>
        <RadioGroup value={selectedQuoteId || ''} onChange={(e) => onSelect && onSelect(e.target.value)}>
          <Stack spacing={3}>
            {Object.keys(quotesGroupedByProvider).map((providerName) => {
              const providerQuotes = quotesGroupedByProvider[providerName];

              return (
                <Box key={providerName}>
                  {/* Provider Name Header */}
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ mb: 1.5, textTransform: 'capitalize' }}
                  >
                    {providerName}
                  </Typography>

                  {/* Provider Quotes */}
                  <Stack spacing={2}>
                    {providerQuotes.map((quote) => (
                      <Box
                        key={quote.id}
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          border: (theme) => `1px solid ${theme.palette.divider}`,
                          bgcolor: Number(selectedQuoteId) === quote.id ? 'action.selected' : 'background.paper',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            borderColor: 'primary.main',
                          },
                          cursor: onSelect ? 'pointer' : 'default',
                        }}
                        onClick={() => onSelect && onSelect(quote.id)}
                      >
                        <FormControlLabel
                          value={quote.id}
                          control={<Radio />}
                          sx={{ width: '100%', m: 0 }}
                          label={
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1, width: '100%' }}>
                              {/* Provider Logo */}
                              <Avatar
                                src={quote.connection?.provider?.logo}
                                alt={quote.connection?.provider?.name}
                                variant="rounded"
                                sx={{
                                  width: 48,
                                  height: 48,
                                  bgcolor: 'background.neutral',
                                  border: (theme) => `1px solid ${theme.palette.divider}`,
                                }}
                              />

                              {/* Service Details */}
                              <Box sx={{ flexGrow: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                  <Typography variant="subtitle2">
                                    {quote.service_name}
                                  </Typography>
                                  {quote.connection?.is_default && (
                                    <Chip
                                      label={t('default')}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  )}
                                </Stack>

                                {/* Delivery Estimate */}
                                {quote.estimated_delivery && (
                                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                                    <Iconify icon="eva:clock-outline" width={16} sx={{ color: 'text.secondary' }} />
                                    <Typography variant="caption" color="text.secondary">
                                      {quote.estimated_delivery.min_days === quote.estimated_delivery.max_days
                                        ? `${quote.estimated_delivery.min_days} ${quote.estimated_delivery.min_days === 1 ? t('day') : t('days')}`
                                        : `${quote.estimated_delivery.min_days}-${quote.estimated_delivery.max_days} ${t('days')}`}
                                    </Typography>
                                  </Stack>
                                )}
                              </Box>

                              {/* Price */}
                              <Box sx={{ textAlign: 'end' }}>
                                <Typography variant="h6" color="primary">
                                  {fCurrency(quote.price)}
                                </Typography>
                                {quote.metadata?.base_fee && quote.metadata?.base_fee !== quote.price && (
                                  <Typography variant="caption" color="text.secondary">
                                    {t('base')}: {fCurrency(quote.metadata?.base_fee)} {quote.currency}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          }
                        />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </RadioGroup>

        {selectedQuoteId && onShip && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="contained" onClick={onShip} startIcon={<Iconify icon="solar:delivery-bold" />}>
              {t('create_shipment')}
            </Button>
          </Box>
        )}
      </Box>
    </Card>
  );
}

OrderShipping.propTypes = {
  quotesGroupedByProvider: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  loading: PropTypes.bool,
  error: PropTypes.object,
  onRefresh: PropTypes.func,
  onSelect: PropTypes.func,
  selectedQuoteId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onShip: PropTypes.func,
};
