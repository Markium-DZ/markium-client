import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { t } from 'i18next';

import Iconify from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

const WITHOUT_US = [
  {
    title: t('manual_inventory'),
    description: t('manual_inventory_desc'),
  },
  {
    title: t('limited_reach'),
    description: t('limited_reach_desc'),
  },
  {
    title: t('complex_payments'),
    description: t('complex_payments_desc'),
  },
  {
    title: t('no_analytics'),
    description: t('no_analytics_desc'),
  },
];

const WITH_US = [
  {
    title: t('automated_inventory'),
    description: t('automated_inventory_desc'),
  },
  {
    title: t('global_reach'),
    description: t('global_reach_desc'),
  },
  {
    title: t('seamless_payments'),
    description: t('seamless_payments_desc'),
  },
  {
    title: t('real_time_analytics'),
    description: t('real_time_analytics_desc'),
  },
];

// ----------------------------------------------------------------------

export default function HomeComparison() {
  return (
    <Box
      sx={{
        py: { xs: 10, md: 15 },
        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
      }}
    >
      <Container component={MotionViewport}>
        <Stack spacing={3} sx={{ textAlign: 'center', mb: { xs: 5, md: 10 } }}>
          <m.div variants={varFade().inUp}>
            <Typography component="div" variant="overline" sx={{ color: 'text.disabled' }}>
              {t('comparison')}
            </Typography>
          </m.div>

          <m.div variants={varFade().inDown}>
            <Typography variant="h2">{t('why_choose_markium')}</Typography>
          </m.div>

          <m.div variants={varFade().inDown}>
            <Typography sx={{ color: 'text.secondary' }}>
              {t('see_the_difference')}
            </Typography>
          </m.div>
        </Stack>

        <Box
          gap={{ xs: 3, lg: 3 }}
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            md: 'repeat(2, 1fr)',
          }}
        >
          {/* Without Us Column */}
          <m.div variants={varFade().inLeft}>
            <Card
              sx={{
                p: 5,
                height: 1,
                position: 'relative',
                overflow: 'visible',
                border: 'none',
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.04),
                boxShadow: (theme) => theme.customShadows.z8,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.customShadows.z16,
                },
              }}
            >
              <Stack spacing={3}>
                {/* 3D Sad Avatar */}
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: (theme) =>
                        `linear-gradient(135deg, ${alpha(
                          theme.palette.error.main,
                          0.3
                        )}, ${alpha(theme.palette.error.dark, 0.1)})`,
                      boxShadow: (theme) =>
                        `0 20px 40px ${alpha(theme.palette.error.main, 0.2)}`,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: -10,
                        borderRadius: '50%',
                        background: (theme) =>
                          `linear-gradient(135deg, ${alpha(
                            theme.palette.error.main,
                            0.1
                          )}, transparent)`,
                        zIndex: -1,
                      },
                    }}
                  >
                    <Typography variant="h1" sx={{ fontSize: '4rem' }}>
                      😞
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h4" sx={{ textAlign: 'center', color: 'error.main' }}>
                  {t('without_us')}
                </Typography>

                <Stack spacing={3}>
                  {WITHOUT_US.map((item, index) => (
                    <Stack key={index} spacing={1}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify
                          icon="mdi:close"
                          width={20}
                          sx={{ color: 'error.main' }}
                        />
                        <Typography variant="h6">{item.title}</Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', pl: 3.5 }}
                      >
                        {item.description}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Card>
          </m.div>

          {/* With Us Column */}
          <m.div variants={varFade().inRight}>
            <Card
              sx={{
                p: 5,
                height: 1,
                position: 'relative',
                overflow: 'visible',
                border: 'none',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                boxShadow: (theme) => theme.customShadows.z24,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.customShadows.primary,
                },
              }}
            >
              <Stack spacing={3}>
                {/* 3D Happy Avatar */}
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      boxShadow: (theme) =>
                        `0 20px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
                      position: 'relative',
                      animation: 'float 3s ease-in-out infinite',
                      '@keyframes float': {
                        '0%, 100%': {
                          transform: 'translateY(0px)',
                        },
                        '50%': {
                          transform: 'translateY(-10px)',
                        },
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: -10,
                        borderRadius: '50%',
                        background: (theme) =>
                          `linear-gradient(135deg, ${alpha(
                            theme.palette.primary.main,
                            0.2
                          )}, transparent)`,
                        zIndex: -1,
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: -20,
                        borderRadius: '50%',
                        background: (theme) =>
                          `radial-gradient(circle, ${alpha(
                            theme.palette.primary.main,
                            0.1
                          )}, transparent 70%)`,
                        zIndex: -2,
                      },
                    }}
                  >
                    <Typography variant="h1" sx={{ fontSize: '4rem' }}>
                      🎉
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h4" sx={{ textAlign: 'center', color: 'primary.main' }}>
                  {t('with_us')}
                </Typography>

                <Stack spacing={3}>
                  {WITH_US.map((item, index) => (
                    <Stack key={index} spacing={1}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify
                          icon="mdi:check-bold"
                          width={20}
                          sx={{ color: 'primary.main' }}
                        />
                        <Typography variant="h6">{item.title}</Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary', pl: 3.5 }}
                      >
                        {item.description}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>

              {/* Decorative badge */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                  {t('recommended')}
                </Typography>
              </Box>
            </Card>
          </m.div>
        </Box>
      </Container>
    </Box>
  );
}
