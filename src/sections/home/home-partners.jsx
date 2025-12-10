import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme, keyframes } from '@mui/material/styles';

import { t } from 'i18next';

import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

// Sample partner logos - you can replace with actual partner logos
const PARTNERS = [
  { name: 'Salla', logo: '/assets/partners/salla.png' },
  { name: 'Zid', logo: '/assets/partners/zid.png' },
  { name: 'PayPal', logo: '/assets/partners/paypal.png' },
  { name: 'Stripe', logo: '/assets/partners/stripe.png' },
  { name: 'Shopify', logo: '/assets/partners/shopify.png' },
  { name: 'Amazon', logo: '/assets/partners/amazon.png' },
  { name: 'Aramex', logo: '/assets/partners/aramex.png' },
  { name: 'DHL', logo: '/assets/partners/dhl.png' },
  { name: 'FedEx', logo: '/assets/partners/fedex.png' },
  { name: 'UPS', logo: '/assets/partners/ups.png' },
];

// Duplicate for seamless loop
const ALL_PARTNERS = [...PARTNERS, ...PARTNERS];

// ----------------------------------------------------------------------

const scroll = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
`;

// ----------------------------------------------------------------------

export default function HomePartners() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: { xs: 10, md: 15 },
        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
        overflow: 'hidden',
      }}
    >
      <Container component={MotionViewport}>
        <Stack spacing={3} sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
          <m.div variants={varFade().inUp}>
            <Typography component="div" variant="overline" sx={{ color: 'text.disabled' }}>
              {t('our_partners')}
            </Typography>
          </m.div>

          <m.div variants={varFade().inDown}>
            <Typography variant="h2">{t('trusted_partners')}</Typography>
          </m.div>

          <m.div variants={varFade().inDown}>
            <Typography sx={{ color: 'text.secondary' }}>
              {t('integrated_with_leading')}
            </Typography>
          </m.div>
        </Stack>
      </Container>

      {/* Auto-scrolling logos */}
      <Box
        sx={{
          width: '100%',
          position: 'relative',
          '&:before, &:after': {
            content: '""',
            position: 'absolute',
            top: 0,
            width: 100,
            height: '100%',
            zIndex: 2,
            pointerEvents: 'none',
          },
          '&:before': {
            left: 0,
            background: `linear-gradient(to right, ${theme.palette.background.default}, transparent)`,
          },
          '&:after': {
            right: 0,
            background: `linear-gradient(to left, ${theme.palette.background.default}, transparent)`,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            animation: `${scroll} 30s linear infinite`,
            '&:hover': {
              animationPlayState: 'paused',
            },
          }}
        >
          {ALL_PARTNERS.map((partner, index) => (
            <Box
              key={`${partner.name}-${index}`}
              sx={{
                flex: '0 0 auto',
                width: 200,
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 3,
                p: 3,
                borderRadius: 2,
                bgcolor: 'background.paper',
                transition: 'all 0.3s ease-in-out',
                border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: (theme) => theme.customShadows.z8,
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.24),
                },
              }}
            >
              <Box
                component="img"
                src={partner.logo}
                alt={partner.name}
                onError={(e) => {
                  // Fallback to text if image doesn't exist
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div style="font-weight: 600; color: ${theme.palette.text.secondary}; text-align: center;">${partner.name}</div>`;
                }}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  filter: 'grayscale(100%)',
                  opacity: 0.7,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    filter: 'grayscale(0%)',
                    opacity: 1,
                  },
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Alternative: Grid view for mobile */}
      <Container sx={{ mt: 5, display: { xs: 'block', md: 'none' } }}>
        <Box
          display="grid"
          gridTemplateColumns="repeat(2, 1fr)"
          gap={2}
        >
          {PARTNERS.slice(0, 6).map((partner, index) => (
            <m.div key={partner.name} variants={varFade().inUp}>
              <Box
                sx={{
                  height: 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                }}
              >
                <Box
                  component="img"
                  src={partner.logo}
                  alt={partner.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<div style="font-weight: 600; color: ${theme.palette.text.secondary}; text-align: center; font-size: 14px;">${partner.name}</div>`;
                  }}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    filter: 'grayscale(100%)',
                    opacity: 0.7,
                  }}
                />
              </Box>
            </m.div>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
