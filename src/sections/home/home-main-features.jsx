import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { t } from 'i18next';

import Iconify from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

const FEATURES = [
  {
    icon: 'mdi:cart-outline',
    title: t('multi_store_management'),
    description: t('multi_store_management_desc'),
    color: 'primary',
  },
  {
    icon: 'mdi:palette-outline',
    title: t('customizable_templates'),
    description: t('customizable_templates_desc'),
    color: 'secondary',
  },
  {
    icon: 'mdi:chart-line',
    title: t('advanced_analytics'),
    description: t('advanced_analytics_desc'),
    color: 'success',
  },
  {
    icon: 'mdi:truck-delivery-outline',
    title: t('integrated_delivery'),
    description: t('integrated_delivery_desc'),
    color: 'warning',
  },
  {
    icon: 'mdi:credit-card-outline',
    title: t('payment_gateway'),
    description: t('payment_gateway_desc'),
    color: 'info',
  },
  {
    icon: 'mdi:cellphone-link',
    title: t('mobile_apps'),
    description: t('mobile_apps_desc'),
    color: 'error',
  },
  {
    icon: 'mdi:translate',
    title: t('multi_language'),
    description: t('multi_language_desc'),
    color: 'primary',
  },
  {
    icon: 'mdi:shield-check-outline',
    title: t('secure_platform'),
    description: t('secure_platform_desc'),
    color: 'success',
  },
];

// ----------------------------------------------------------------------

export default function HomeMainFeatures() {
  return (
    <Container
      component={MotionViewport}
      sx={{
        py: { xs: 10, md: 15 },
      }}
    >
      <Stack spacing={3} sx={{ textAlign: 'center', mb: { xs: 5, md: 10 } }}>
        <m.div variants={varFade().inUp}>
          <Typography component="div" variant="overline" sx={{ color: 'text.disabled' }}>
            {t('features')}
          </Typography>
        </m.div>

        <m.div variants={varFade().inDown}>
          <Typography variant="h2">{t('powerful_features')}</Typography>
        </m.div>

        <m.div variants={varFade().inDown}>
          <Typography sx={{ color: 'text.secondary' }}>
            {t('everything_you_need')}
          </Typography>
        </m.div>
      </Stack>

      <Box
        gap={{ xs: 3, lg: 4 }}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)',
        }}
      >
        {FEATURES.map((feature, index) => (
          <m.div
            key={feature.title}
            variants={varFade().inUp}
            style={{ transitionDelay: `${index * 0.1}s` }}
          >
            <Card
              sx={{
                p: 4,
                height: 1,
                textAlign: 'center',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: (theme) => theme.customShadows.z24,
                  '& .feature-icon': {
                    transform: 'scale(1.1) rotate(5deg)',
                  },
                },
              }}
            >
              <Stack spacing={3} alignItems="center">
                {/* 3D Icon Container */}
                <Box
                  sx={{
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: -12,
                      borderRadius: '50%',
                      background: (theme) =>
                        `radial-gradient(circle, ${alpha(
                          theme.palette[feature.color].main,
                          0.2
                        )}, transparent 70%)`,
                      zIndex: 0,
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: -20,
                      borderRadius: '50%',
                      background: (theme) =>
                        `radial-gradient(circle, ${alpha(
                          theme.palette[feature.color].main,
                          0.1
                        )}, transparent 60%)`,
                      zIndex: -1,
                    },
                  }}
                >
                  <Box
                    className="feature-icon"
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      zIndex: 1,
                      background: (theme) =>
                        `linear-gradient(135deg, ${alpha(
                          theme.palette[feature.color].main,
                          0.3
                        )}, ${alpha(theme.palette[feature.color].dark, 0.3)})`,
                      boxShadow: (theme) =>
                        `0 12px 24px ${alpha(theme.palette[feature.color].main, 0.3)},
                         0 6px 12px ${alpha(theme.palette[feature.color].main, 0.2)}`,
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    <Iconify
                      icon={feature.icon}
                      width={40}
                      sx={{
                        color: `${feature.color}.main`,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      }}
                    />
                  </Box>
                </Box>

                <Stack spacing={1}>
                  <Typography variant="h6">{feature.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {feature.description}
                  </Typography>
                </Stack>
              </Stack>
            </Card>
          </m.div>
        ))}
      </Box>
    </Container>
  );
}
