import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { t } from 'i18next';

import Iconify from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

const TIMELINE_STEPS = [
  {
    icon: 'mdi:account-plus-outline',
    emoji: '👤',
    title: t('step_1_title'),
    description: t('step_1_desc'),
    duration: t('step_1_duration'),
    color: 'info',
  },
  {
    icon: 'mdi:palette-swatch-outline',
    emoji: '🎨',
    title: t('step_2_title'),
    description: t('step_2_desc'),
    duration: t('step_2_duration'),
    color: 'secondary',
  },
  {
    icon: 'mdi:package-variant-closed',
    emoji: '📦',
    title: t('step_3_title'),
    description: t('step_3_desc'),
    duration: t('step_3_duration'),
    color: 'warning',
  },
  {
    icon: 'mdi:rocket-launch-outline',
    emoji: '🚀',
    title: t('step_4_title'),
    description: t('step_4_desc'),
    duration: t('step_4_duration'),
    color: 'primary',
  },
  {
    icon: 'mdi:chart-line-variant',
    emoji: '📈',
    title: t('step_5_title'),
    description: t('step_5_desc'),
    duration: t('step_5_duration'),
    color: 'success',
  },
];

// ----------------------------------------------------------------------

export default function HomeTimeline() {
  const theme = useTheme();

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
              {t('your_journey')}
            </Typography>
          </m.div>

          <m.div variants={varFade().inDown}>
            <Typography variant="h2">{t('from_zero_to_hero')}</Typography>
          </m.div>

          <m.div variants={varFade().inDown}>
            <Typography sx={{ color: 'text.secondary' }}>
              {t('simple_steps_success')}
            </Typography>
          </m.div>
        </Stack>

        <Box sx={{ position: 'relative' }}>
          {/* Timeline Line */}
          <Box
            sx={{
              position: 'absolute',
              left: { xs: 24, md: '50%' },
              top: 0,
              bottom: 0,
              width: 4,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
              transform: { md: 'translateX(-50%)' },
              zIndex: 0,
            }}
          />

          <Stack spacing={{ xs: 4, md: 6 }}>
            {TIMELINE_STEPS.map((step, index) => (
              <m.div key={index} variants={varFade().inUp}>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: { xs: 'row', md: index % 2 === 0 ? 'row' : 'row-reverse' },
                    alignItems: 'center',
                    gap: { xs: 3, md: 5 },
                  }}
                >
                  {/* Content */}
                  <Box
                    sx={{
                      flex: 1,
                      textAlign: { xs: 'left', md: index % 2 === 0 ? 'right' : 'left' },
                      pl: { xs: 7, md: 0 },
                    }}
                  >
                    <Stack
                      spacing={1}
                      sx={{
                        maxWidth: { md: 400 },
                        ml: { md: index % 2 === 0 ? 'auto' : 0 },
                        mr: { md: index % 2 === 0 ? 0 : 'auto' },
                      }}
                    >
                      <Typography
                        variant="overline"
                        sx={{
                          color: 'primary.main',
                          fontWeight: 'bold',
                        }}
                      >
                        {step.duration}
                      </Typography>
                      <Typography variant="h5">{step.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {step.description}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* 3D Emoji Avatar */}
                  <Box
                    sx={{
                      position: { xs: 'absolute', md: 'relative' },
                      left: { xs: 0, md: 'auto' },
                      zIndex: 1,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: -12,
                        borderRadius: '50%',
                        background: (theme) =>
                          `radial-gradient(circle, ${alpha(
                            theme.palette[step.color].main,
                            0.25
                          )}, transparent 70%)`,
                        zIndex: 0,
                        animation: 'pulse 2s ease-in-out infinite',
                        '@keyframes pulse': {
                          '0%, 100%': {
                            opacity: 1,
                            transform: 'scale(1)',
                          },
                          '50%': {
                            opacity: 0.7,
                            transform: 'scale(1.15)',
                          },
                        },
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: -20,
                        borderRadius: '50%',
                        background: (theme) =>
                          `radial-gradient(circle, ${alpha(
                            theme.palette[step.color].main,
                            0.15
                          )}, transparent 60%)`,
                        zIndex: -1,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: (theme) =>
                          `linear-gradient(135deg, ${theme.palette[step.color].main}, ${theme.palette[step.color].dark})`,
                        boxShadow: (theme) =>
                          `0 12px 28px ${alpha(theme.palette[step.color].main, 0.35)},
                           0 6px 14px ${alpha(theme.palette[step.color].main, 0.25)},
                           inset 0 -2px 8px ${alpha(theme.palette.common.black, 0.2)},
                           inset 0 2px 8px ${alpha(theme.palette.common.white, 0.3)}`,
                        zIndex: 1,
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.15) rotate(5deg)',
                          boxShadow: (theme) =>
                            `0 16px 36px ${alpha(theme.palette[step.color].main, 0.45)},
                             0 8px 18px ${alpha(theme.palette[step.color].main, 0.35)}`,
                        },
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '2.5rem',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                        }}
                      >
                        {step.emoji}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Spacer for desktop */}
                  <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />
                </Box>
              </m.div>
            ))}
          </Stack>

          {/* End Badge */}
          <m.div variants={varFade().inUp}>
            <Box
              sx={{
                mt: 6,
                display: 'flex',
                justifyContent: { xs: 'flex-start', md: 'center' },
                pl: { xs: 0, md: 0 },
              }}
            >
              <Box
                sx={{
                  px: 4,
                  py: 2,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  boxShadow: (theme) => theme.customShadows.z20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Iconify icon="mdi:trophy-outline" width={24} />
                <Typography variant="h6">{t('success_achieved')}</Typography>
              </Box>
            </Box>
          </m.div>
        </Box>
      </Container>
    </Box>
  );
}
