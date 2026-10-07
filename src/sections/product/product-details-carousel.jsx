import { useEffect } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { alpha, styled, useTheme } from '@mui/material/styles';

import { bgGradient } from 'src/theme/css';

import { RouterLink } from 'src/routes/components';
import { useTranslate } from 'src/locales';
import { fCurrency } from 'src/utils/format-number';
import Image from 'src/components/image';
import Iconify from 'src/components/iconify';
import Lightbox, { useLightBox } from 'src/components/lightbox';
import Carousel, { useCarousel, CarouselArrowIndex } from 'src/components/carousel';

// ----------------------------------------------------------------------

const THUMB_SIZE = 64;

const StyledThumbnailsContainer = styled('div')(({ length, theme }) => ({
  position: 'relative',
  margin: theme.spacing(0, 'auto'),
  '& .slick-slide': {
    lineHeight: 0,
  },

  ...(length === 1 && {
    maxWidth: THUMB_SIZE * 1 + 16,
  }),

  ...(length === 2 && {
    maxWidth: THUMB_SIZE * 2 + 32,
  }),

  ...((length === 3 || length === 4) && {
    maxWidth: THUMB_SIZE * 3 + 48,
  }),

  ...(length >= 5 && {
    maxWidth: THUMB_SIZE * 6,
  }),

  ...(length > 3 && {
    '&:before, &:after': {
      ...bgGradient({
        direction: 'to left',
        startColor: `${alpha(theme.palette.background.default, 0)} 0%`,
        endColor: `${theme.palette.background.default} 100%`,
      }),
      top: 0,
      zIndex: 9,
      content: "''",
      height: '100%',
      position: 'absolute',
      width: (THUMB_SIZE * 2) / 3,
    },
    '&:after': {
      right: 0,
      transform: 'scaleX(-1)',
    },
  }),
}));

// ----------------------------------------------------------------------

export default function ProductDetailsCarousel({ product, editLink }) {
  const theme = useTheme();
  const { t } = useTranslate();

  // Collect all variant media images
  let mediaSource = [];

  if (product?.variants && product.variants.length > 0) {
    // Get all media from all variants
    product.variants.forEach((variant) => {
      if (variant.media && Array.isArray(variant.media)) {
        // Media is an array, add all items
        mediaSource.push(...variant.media);
      } else if (variant.media && typeof variant.media === 'object') {
        // Backwards compatibility: single media object
        mediaSource.push(variant.media);
      }
    });
  }

  // If no variant media, fall back to product images
  if (mediaSource.length === 0 && product?.images) {
    mediaSource = Array.isArray(product.images)
      ? product.images
      : [product.images];
  }

  // Map each image src to variant info (options label + price)
  const imageVariantMap = {};
  (product?.variants || []).forEach((variant) => {
    const media = Array.isArray(variant.media)
      ? variant.media
      : variant.media
      ? [variant.media]
      : [];
    const label = variant.options?.map((o) => o.value).filter(Boolean).join(' · ') || '';
    const price = parseFloat(variant.price) || 0;
    media.forEach((m) => {
      const src = m?.full_url || m?.url || m?.src || '';
      if (src && !imageVariantMap[src]) {
        imageVariantMap[src] = { label, price };
      }
    });
  });

  const slides = mediaSource.map((img) => {
    const src = typeof img === 'string' ? img : img?.full_url || img?.url || img?.src || '';
    const info = imageVariantMap[src];
    const parts = [info?.label, info?.price > 0 && fCurrency(info.price)].filter(Boolean);
    return {
      src,
      ...(parts.length > 0 && { title: parts.join('  ·  ') }),
    };
  });

  const renderEmpty = slides.length === 0 && (
    <Box
      sx={{
        height: 320,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        color: 'text.disabled',
        gap: 1.5,
      }}
    >
      <Iconify icon="solar:camera-add-bold-duotone" width={48} />
      <Typography variant="subtitle2">{t('no_images_yet')}</Typography>
      {editLink && (
        <Button
          component={RouterLink}
          href={editLink}
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<Iconify icon="solar:pen-bold" width={16} />}
        >
          {t('add_images')}
        </Button>
      )}
    </Box>
  );

  const lightbox = useLightBox(slides);

  const carouselLarge = useCarousel({
    rtl: false,
    draggable: false,
    adaptiveHeight: true,
  });

  const carouselThumb = useCarousel({
    rtl: false,
    centerMode: true,
    swipeToSlide: true,
    focusOnSelect: true,
    variableWidth: true,
    centerPadding: '0px',
    slidesToShow: slides?.length > 3 ? 3 : slides?.length,
  });

  useEffect(() => {
    carouselLarge.onSetNav();
    carouselThumb.onSetNav();
  }, [carouselLarge, carouselThumb]);

  useEffect(() => {
    if (lightbox.open) {
      carouselLarge.onTogo(lightbox.selected);
    }
  }, [carouselLarge, lightbox.open, lightbox.selected]);

  const renderLargeImg = slides?.length > 0 ? (
    <Box
      sx={{
        mb: 3,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Carousel
        {...carouselLarge.carouselSettings}
        asNavFor={carouselThumb.nav}
        ref={carouselLarge.carouselRef}
      >
        {slides.map((slide) => (
          <Box key={slide.src} sx={{ position: 'relative' }}>
            <Image
              alt={slide.src}
              src={slide.src}
              ratio="1/1"
              onClick={() => lightbox.onOpen(slide.src)}
              sx={{ cursor: 'zoom-in' }}
            />
            {imageVariantMap[slide.src]?.label && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.25,
                  py: 0.625,
                  borderRadius: 1,
                  pointerEvents: 'none',
                  backdropFilter: 'blur(12px)',
                  bgcolor: (t) => alpha(t.palette.grey[900], 0.6),
                  border: '1px solid',
                  borderColor: (t) => alpha(t.palette.common.white, 0.12),
                }}
              >
                <Typography
                  sx={{
                    color: 'common.white',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    lineHeight: 1.4,
                    letterSpacing: 0.2,
                  }}
                >
                  {imageVariantMap[slide.src].label}
                </Typography>

                {imageVariantMap[slide.src].price > 0 && (
                  <>
                    <Box
                      sx={{
                        width: '1px',
                        height: 14,
                        bgcolor: (t) => alpha(t.palette.common.white, 0.25),
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{
                        color: (t) => alpha(t.palette.common.white, 0.85),
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        lineHeight: 1.4,
                      }}
                    >
                      {fCurrency(imageVariantMap[slide.src].price)}
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Box>
        ))}
      </Carousel>

      <CarouselArrowIndex
        index={carouselLarge.currentIndex}
        total={slides.length}
        onNext={carouselThumb.onNext}
        onPrev={carouselThumb.onPrev}
      />
    </Box>
  ) : null;

  const renderThumbnails = slides?.length > 0 ? (
    <StyledThumbnailsContainer length={slides.length}>
      <Carousel
        {...carouselThumb.carouselSettings}
        asNavFor={carouselLarge.nav}
        ref={carouselThumb.carouselRef}
      >
        {slides.map((item, index) => (
          <Box key={item.src} sx={{ px: 0.5 }}>
            <Avatar
              key={item.src}
              alt={item.src}
              src={item.src}
              variant="rounded"
              sx={{
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                opacity: 0.48,
                cursor: 'pointer',
                ...(carouselLarge.currentIndex === index && {
                  opacity: 1,
                  border: `solid 2.5px ${theme.palette.primary.main}`,
                }),
              }}
            />
          </Box>
        ))}
      </Carousel>
    </StyledThumbnailsContainer>
  ) : null;

  if (slides.length === 0) {
    return renderEmpty;
  }

  return (
    <Box
      sx={{
        '& .slick-slide': {
          float: theme.direction === 'rtl' ? 'right' : 'left',
        },
      }}
    >
      {renderLargeImg}

      {renderThumbnails}

      <Lightbox
        index={lightbox.selected}
        slides={slides}
        open={lightbox.open}
        close={lightbox.onClose}
        onGetCurrentIndex={(index) => lightbox.setSelected(index)}
      />
    </Box>
  );
}

ProductDetailsCarousel.propTypes = {
  product: PropTypes.object,
  editLink: PropTypes.string,
};
