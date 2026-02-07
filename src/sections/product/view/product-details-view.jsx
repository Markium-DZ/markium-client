import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetProduct, deployProduct } from 'src/api/product';
import showError from 'src/utils/show_error';
import { PRODUCT_PUBLISH_OPTIONS } from 'src/_mock';

import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';
import { useTranslate } from 'src/locales';
import { useAuthContext } from 'src/auth/hooks';
import { useSnackbar } from 'src/components/snackbar';
import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';
import { useBoolean } from 'src/hooks/use-boolean';
import { ConfirmDialog } from 'src/components/custom-dialog';
import LoadingButton from '@mui/lab/LoadingButton';

import { ProductDetailsSkeleton } from '../product-skeleton';
import ProductDetailsSummary from '../product-details-summary';
import ProductDetailsToolbar from '../product-details-toolbar';
import ProductDetailsCarousel from '../product-details-carousel';
import ProductDetailsDescription from '../product-details-description';
import ProductDetailsVariants from '../product-details-variants';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export default function ProductDetailsView({ id }) {
  const { product, productLoading, productError, productMutate } = useGetProduct(id);
  console.log("product :" ,product)

  const settings = useSettingsContext();
  const { t } = useTranslate();
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const { copy } = useCopyToClipboard();

  const publicProductUrl = user?.store?.slug
    ? `https://${user.store.slug}.markium.online/?product_slug=${product.slug}`
    : '';

  const handleCopyLink = useCallback(() => {
    if (publicProductUrl) {
      copy(publicProductUrl);
      enqueueSnackbar(t('link_copied_to_clipboard'), { variant: 'success' });
    }
  }, [publicProductUrl, copy, enqueueSnackbar, t]);

  const SUMMARY = [
    {
      title: t('product_original'),
      description: t('product_original_desc'),
      icon: 'solar:verified-check-bold',
    },
    {
      title: t('product_replacement'),
      description: t('product_replacement_desc'),
      icon: 'solar:clock-circle-bold',
    },
    {
      title: t('product_warranty'),
      description: t('product_warranty_desc'),
      icon: 'solar:shield-check-bold',
    },
  ];

  const [currentTab, setCurrentTab] = useState('variants');

  const [publish, setPublish] = useState('');

  const [publishLoading, setPublishLoading] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState(null);

  const publishConfirm = useBoolean();

  // Check if product is already deployed
  const isDeployed = product?.status === 'deployed' || product?.status === 'published';

  useEffect(() => {
    if (product) {
      // Map 'deployed' status to 'published' for the toolbar display
      const status = product?.status === 'deployed' ? 'published' : (product?.status || product?.publish || '');
      setPublish(status);
      // Set default variant
      const defaultVar = product?.variants?.find((v) => v.is_default) || product?.variants?.[0];
      setSelectedVariant(defaultVar);
    }
  }, [product]);

  const handleChangePublish = useCallback((newValue) => {
    // If selecting 'published' and product is not already deployed, show confirm dialog
    if (newValue === 'published' && !isDeployed) {
      publishConfirm.onTrue();
    } else if (newValue === 'published' && isDeployed) {
      // Product is already deployed, show info message
      enqueueSnackbar(t('product_already_published'), { variant: 'info' });
    } else {
      // For draft, just update local state (or implement unpublish API if available)
      setPublish(newValue);
    }
  }, [isDeployed, publishConfirm, enqueueSnackbar, t]);

  const handleConfirmPublish = useCallback(async () => {
    try {
      setPublishLoading(true);
      await deployProduct(id);
      setPublish('published');
      enqueueSnackbar(t('product_published_successfully'), { variant: 'success' });
      productMutate(); // Refresh product data
      publishConfirm.onFalse();
    } catch (error) {
      console.error('Deploy error:', error);
      showError(error);
    } finally {
      setPublishLoading(false);
    }
  }, [id, enqueueSnackbar, t, productMutate, publishConfirm]);

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const renderSkeleton = <ProductDetailsSkeleton />;

  const renderError = (
    <EmptyContent
      filled
      title={`${productError?.message}`}
      action={
        <Button
          component={RouterLink}
          href={paths.dashboard.product.root}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
          sx={{ mt: 3 }}
        >
          Back to List
        </Button>
      }
      sx={{ py: 10 }}
    />
  );

  const renderProduct = product && (
    <>
      <ProductDetailsToolbar
        backLink={paths.dashboard.product.root}
        editLink={paths.dashboard.product.edit(`${product?.id}`)}
        liveLink={paths.product.details(`${product?.id}`)}
        publish={publishLoading ? '' : (publish || '')}
        onChangePublish={handleChangePublish}
        publishOptions={PRODUCT_PUBLISH_OPTIONS}
      />

      {publicProductUrl && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.5}
          sx={{ mb: 2 }}
        >
          <Tooltip title={t('copy_link')}>
            <Button
              size="small"
              variant="soft"
              color="primary"
              onClick={handleCopyLink}
              startIcon={<Iconify icon="eva:link-2-fill" width={16} />}
              endIcon={<Iconify icon="eva:copy-fill" width={14} />}
              sx={{
                px: 1.5,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              {t('copy_product_link')}
            </Button>
          </Tooltip>
          <Tooltip title={t('open_in_new_tab')}>
            <IconButton
              component="a"
              href={publicProductUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              color="primary"
              sx={{ p: 0.5 }}
            >
              <Iconify icon="eva:external-link-fill" width={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      )}

      <Grid container spacing={{ xs: 3, md: 5, lg: 8 }}>
        <Grid xs={12} md={6} lg={7}>
          <ProductDetailsCarousel product={product} />
        </Grid>

        <Grid xs={12} md={6} lg={5}>
          <ProductDetailsSummary
            disabledActions
            product={product}
            selectedVariant={selectedVariant}
            onVariantChange={setSelectedVariant}
          />
        </Grid>
      </Grid>

      <Box
        gap={5}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
        sx={{ my: 10 }}
      >
        {/* {SUMMARY.map((item) => (
          <Box key={item.title} sx={{ textAlign: 'center', px: 5 }}>
            <Iconify icon={item.icon} width={32} sx={{ color: 'primary.main' }} />

            <Typography variant="subtitle1" sx={{ mb: 1, mt: 2 }}>
              {item.title}
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {item.description}
            </Typography>
          </Box>
        ))} */}
      </Box>

      <Card>
        <Tabs
          value={currentTab}
          onChange={handleChangeTab}
          sx={{
            px: 3,
            boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
          }}
        >
          {[
            {
              value: 'variants',
              label: `${t('variants')} (${product?.variants?.length || 0})`,
            },
            {
              value: 'description',
              label: t('product_description'),
            },
          ].map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} />
          ))}
        </Tabs>

        {currentTab === 'description' && (
          <ProductDetailsDescription
            description={
              typeof product?.content === 'string'
                ? product.content
                : typeof product?.description === 'string'
                ? product.description
                : ''
            }
          />
        )}

        {currentTab === 'variants' && (
          <ProductDetailsVariants
            product={product}
            optionDefinitions={product?.option_definitions || []}
            onRefresh={productMutate}
          />
        )}
      </Card>
    </>
  );

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        {productLoading && renderSkeleton}

        {productError && renderError}

        {product && renderProduct}
      </Container>

      <ConfirmDialog
        open={publishConfirm.value}
        onClose={publishConfirm.onFalse}
        title={t('publish_product')}
        content={t('are_you_sure_you_want_to_publish_this_product')}
        action={
          <LoadingButton
            variant="contained"
            color="success"
            loading={publishLoading}
            onClick={handleConfirmPublish}
          >
            {t('publish')}
          </LoadingButton>
        }
      />
    </>
  );
}

ProductDetailsView.propTypes = {
  id: PropTypes.string,
};
