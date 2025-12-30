import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { varFade, MotionViewport } from 'src/components/animate';
import { t } from 'i18next';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const CARDS = [
  {
    icon: 'mdi:package-variant',
    title: t("create_products_title"),
    description: t("create_products_desc"),
    color: 'primary',
  },
  {
    icon: 'mdi:clipboard-list-outline',
    title: t("manage_orders_title"),
    description: t("manage_orders_desc"),
    color: 'info',
  },
  {
    icon: 'mdi:truck-fast-outline',
    title: t("track_delivery_title"),
    description: t("track_delivery_desc"),
    color: 'success',
  },
];

// ----------------------------------------------------------------------

export default function HomeMinimal() {
  return (
    <Container
      component={MotionViewport}
      sx={{
        py: { xs: 10, md: 15 },
      }}
    >
      <Stack
        spacing={3}
        sx={{
          textAlign: 'center',
          mb: { xs: 5, md: 10 },
        }}
      >
        <m.div variants={varFade().inUp}>
          <Typography component="div" variant="overline" sx={{ color: 'text.disabled' }}>
            {t("markium")}
          </Typography>
        </m.div>

        <m.div variants={varFade().inDown}>
          <Typography variant="h2">
            {t("what_markium")}
          </Typography>
        </m.div>
      </Stack>

      <Box
        gap={{ xs: 3, lg: 10 }}
        display="grid"
        alignItems="center"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
      >
        {CARDS.map((card, index) => (
          <m.div variants={varFade().inUp} key={card.title}>
            <Card
              sx={{
                textAlign: 'center',
                boxShadow: { md: 'none' },
                bgcolor: 'background.default',
                p: (theme) => theme.spacing(10, 5),
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: (theme) => theme.customShadows.z24,
                  '& .icon-container': {
                    transform: 'scale(1.1) rotate(5deg)',
                  },
                },
                ...(index === 1 && {
                  boxShadow: (theme) => ({
                    md: `-40px 40px 80px ${theme.palette.mode === 'light'
                        ? alpha(theme.palette.grey[500], 0.16)
                        : alpha(theme.palette.common.black, 0.4)
                      }`,
                  }),
                }),
              }}
            >
              {/* 3D Icon Container */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 3,
                }}
              >
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
                          theme.palette[card.color].main,
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
                          theme.palette[card.color].main,
                          0.1
                        )}, transparent 60%)`,
                      zIndex: -1,
                    },
                  }}
                >
                  <Box
                    className="icon-container"
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
                          theme.palette[card.color].main,
                          0.3
                        )}, ${alpha(theme.palette[card.color].dark, 0.3)})`,
                      boxShadow: (theme) =>
                        `0 12px 24px ${alpha(theme.palette[card.color].main, 0.3)},
                         0 6px 12px ${alpha(theme.palette[card.color].main, 0.2)}`,
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    <Iconify
                      icon={card.icon}
                      width={40}
                      sx={{
                        color: `${card.color}.main`,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              <Typography variant="h5" sx={{ mt: 5, mb: 2 }}>
                {card.title}
              </Typography>

              <Typography sx={{ color: 'text.secondary' }}>{card.description}</Typography>
            </Card>
          </m.div>
        ))}
      </Box>
    </Container>
  );
}
