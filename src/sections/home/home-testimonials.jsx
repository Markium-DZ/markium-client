import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { t } from 'i18next';

import Iconify from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

const TESTIMONIALS = [
  {
    name: 'Ahmed Hassan',
    role: t('testimonial_1_role'),
    avatar: '/assets/images/avatar/avatar_1.jpg',
    rating: 5,
    content: t('testimonial_1_content'),
    store: t('testimonial_1_store'),
  },
  {
    name: 'Sarah Johnson',
    role: t('testimonial_2_role'),
    avatar: '/assets/images/avatar/avatar_2.jpg',
    rating: 5,
    content: t('testimonial_2_content'),
    store: t('testimonial_2_store'),
  },
  {
    name: 'Mohamed Ali',
    role: t('testimonial_3_role'),
    avatar: '/assets/images/avatar/avatar_3.jpg',
    rating: 5,
    content: t('testimonial_3_content'),
    store: t('testimonial_3_store'),
  },
  {
    name: 'Lisa Chen',
    role: t('testimonial_4_role'),
    avatar: '/assets/images/avatar/avatar_4.jpg',
    rating: 5,
    content: t('testimonial_4_content'),
    store: t('testimonial_4_store'),
  },
  {
    name: 'Omar Ibrahim',
    role: t('testimonial_5_role'),
    avatar: '/assets/images/avatar/avatar_5.jpg',
    rating: 5,
    content: t('testimonial_5_content'),
    store: t('testimonial_5_store'),
  },
  {
    name: 'Emma Davis',
    role: t('testimonial_6_role'),
    avatar: '/assets/images/avatar/avatar_6.jpg',
    rating: 5,
    content: t('testimonial_6_content'),
    store: t('testimonial_6_store'),
  },
];

// ----------------------------------------------------------------------

export default function HomeTestimonials() {
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
            {t('testimonials')}
          </Typography>
        </m.div>

        <m.div variants={varFade().inDown}>
          <Typography variant="h2">{t('what_customers_say')}</Typography>
        </m.div>

        <m.div variants={varFade().inDown}>
          <Typography sx={{ color: 'text.secondary' }}>
            {t('trusted_by_thousands')}
          </Typography>
        </m.div>
      </Stack>

      <Box
        gap={{ xs: 3, lg: 4 }}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          md: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
        }}
      >
        {TESTIMONIALS.map((testimonial, index) => (
          <m.div
            key={testimonial.name}
            variants={varFade().inUp}
            style={{ transitionDelay: `${index * 0.1}s` }}
          >
            <Card
              sx={{
                p: 4,
                height: 1,
                position: 'relative',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: (theme) => theme.customShadows.z24,
                },
              }}
            >
              {/* Quote Icon */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 24,
                  right: 24,
                  opacity: 0.1,
                }}
              >
                <Iconify icon="mdi:format-quote-close" width={64} />
              </Box>

              <Stack spacing={3}>
                {/* Rating */}
                <Rating value={testimonial.rating} readOnly size="small" />

                {/* Content */}
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    minHeight: 80,
                    fontStyle: 'italic',
                    position: 'relative',
                    '&:before': {
                      content: '"\u201C"',
                      position: 'absolute',
                      left: -12,
                      top: -8,
                      fontSize: 32,
                      color: 'primary.main',
                      opacity: 0.3,
                    },
                  }}
                >
                  {testimonial.content}
                </Typography>

                {/* Author Info */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: -8,
                        borderRadius: '50%',
                        background: (theme) =>
                          `radial-gradient(circle, ${alpha(
                            theme.palette.primary.main,
                            0.15
                          )}, transparent 70%)`,
                        zIndex: 0,
                      },
                    }}
                  >
                    <Avatar
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      sx={{
                        width: 56,
                        height: 56,
                        position: 'relative',
                        zIndex: 1,
                        boxShadow: (theme) =>
                          `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                        border: (theme) => `3px solid ${theme.palette.background.paper}`,
                      }}
                    />
                  </Box>
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2">{testimonial.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {testimonial.role}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Iconify
                        icon="mdi:store"
                        width={14}
                        sx={{ color: 'primary.main' }}
                      />
                      <Typography variant="caption" sx={{ color: 'primary.main' }}>
                        {testimonial.store}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            </Card>
          </m.div>
        ))}
      </Box>

      {/* Stats Section */}
      <m.div variants={varFade().inUp}>
        <Box
          sx={{
            mt: 10,
            p: 5,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          }}
        >
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            }}
            gap={3}
          >
            {[
              { value: '10,000+', label: t('active_stores') },
              { value: '50M+', label: t('orders_processed') },
              { value: '99.9%', label: t('uptime') },
              { value: '4.9/5', label: t('customer_rating') },
            ].map((stat, index) => (
              <Stack key={index} spacing={1} sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ color: 'primary.main' }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {stat.label}
                </Typography>
              </Stack>
            ))}
          </Box>
        </Box>
      </m.div>
    </Container>
  );
}
