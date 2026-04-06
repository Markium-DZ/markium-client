import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
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
import { getStorefrontUrl } from 'src/config-global';
import { useBoolean } from 'src/hooks/use-boolean';
import { ConfirmDialog } from 'src/components/custom-dialog';
import LoadingButton from '@mui/lab/LoadingButton';

import VerificationGate from 'src/components/verification-gate/verification-gate';

import { ProductDetailsSkeleton } from '../product-skeleton';
import ProductDetailsSummary from '../product-details-summary';
import ProductDetailsToolbar from '../product-details-toolbar';
import ProductDetailsCarousel from '../product-details-carousel';
import ProductDetailsDescription from '../product-details-description';
import ProductDetailsVariants from '../product-details-variants';
import ProductDetailsCosts from '../product-details-costs';

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export default function ProductDetailsView({ id }) {
  const { product, productLoading, productError, productMutate } = useGetProduct(id);

  const settings = useSettingsContext();
  const { t } = useTranslate();
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const { copy } = useCopyToClipboard();

  const publicProductUrl = user?.store?.slug
    ? getStorefrontUrl(user.store.slug, { product_slug: product?.slug })
    : '';

  const handleCopyLink = useCallback(() => {
    if (publicProductUrl) {
      copy(publicProductUrl);
      enqueueSnackbar(t('link_copied_to_clipboard'), { variant: 'success' });
    }
  }, [publicProductUrl, copy, enqueueSnackbar, t]);

  const [currentTab, setCurrentTab] = useState('variants');

  const [publish, setPublish] = useState('');

  const [publishLoading, setPublishLoading] = useState(false);

  const publishConfirm = useBoolean();

  // Check if product is already deployed
  const isDeployed = product?.status === 'deployed' || product?.status === 'published';

  useEffect(() => {
    if (product) {
      // Map 'deployed' status to 'published' for the toolbar display
      const status = product?.status === 'deployed' ? 'published' : (product?.status || product?.publish || '');
      setPublish(status);
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
      title={t('product_not_found')}
      action={
        <Button
          component={RouterLink}
          href={paths.dashboard.product.root}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
          sx={{ mt: 3 }}
        >
          {t('back_to_list')}
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
        publish={publish || ''}
        loading={publishLoading}
        onChangePublish={handleChangePublish}
        publishOptions={PRODUCT_PUBLISH_OPTIONS}
        publicProductUrl={publicProductUrl}
        onCopyLink={handleCopyLink}
      />

      <Grid container spacing={{ xs: 3, md: 4, lg: 5 }}>
        <Grid xs={12} md={6} lg={6}>
          <ProductDetailsCarousel
            product={product}
            editLink={paths.dashboard.product.edit(`${product?.id}`)}
          />
        </Grid>

        <Grid xs={12} md={6} lg={6}>
          <ProductDetailsSummary product={product} />
        </Grid>
      </Grid>

      <Card sx={{ mt: { xs: 3, md: 5 } }}>
        <Tabs
          value={currentTab}
          onChange={handleChangeTab}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: 3,
            boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
          }}
        >
          {[
            {
              value: 'variants',
              label: `${t('variants')} (${product?.variants?.length || 0})`,
              icon: <Iconify icon="solar:layers-bold-duotone" width={18} />,
            },
{
              value: 'costs',
              label: t('costs'),
              icon: <Iconify icon="solar:tag-price-bold-duotone" width={18} />,
            },
            {
              value: 'description',
              label: t('product_description'),
              icon: <Iconify icon="solar:document-text-bold-duotone" width={18} />,
            },
          ].map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} icon={tab.icon} iconPosition="start" />
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
            editLink={paths.dashboard.product.edit(`${product?.id}`)}
          />
        )}

        {currentTab === 'variants' && (
          <ProductDetailsVariants
            product={product}
            optionDefinitions={product?.option_definitions || []}
            onRefresh={productMutate}
          />
        )}

        {currentTab === 'costs' && (
          <ProductDetailsCosts product={product} />
        )}

      </Card>
    </>
  );

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        {productLoading && renderSkeleton}

        {(productError || (!productLoading && !product)) && renderError}

        {product && renderProduct}
      </Container>

      <ConfirmDialog
        open={publishConfirm.value}
        onClose={publishConfirm.onFalse}
        title={t('publish_product')}
        content={t('are_you_sure_you_want_to_publish_this_product')}
        action={
          <VerificationGate>
            <LoadingButton
              variant="contained"
              color="success"
              loading={publishLoading}
              onClick={handleConfirmPublish}
            >
              {t('publish')}
            </LoadingButton>
          </VerificationGate>
        }
      />
    </>
  );
}

ProductDetailsView.propTypes = {
  id: PropTypes.string,
};
