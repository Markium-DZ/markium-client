import { m } from 'framer-motion';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { t } from 'i18next';

import Iconify from 'src/components/iconify';
import { varFade, MotionViewport } from 'src/components/animate';

// ----------------------------------------------------------------------

const PRICING_PLANS = [
  {
    id: 'starter',
    name: t('plan_starter'),
    price: { monthly: 29, yearly: 290 },
    description: t('plan_starter_desc'),
    features: [
      t('feature_1_store'),
      t('feature_100_products'),
      t('feature_basic_templates'),
      t('feature_basic_analytics'),
      t('feature_email_support'),
      t('feature_mobile_responsive'),
    ],
    color: 'info',
    popular: false,
  },
  {
    id: 'professional',
    name: t('plan_professional'),
    price: { monthly: 79, yearly: 790 },
    description: t('plan_professional_desc'),
    features: [
      t('feature_5_stores'),
      t('feature_unlimited_products'),
      t('feature_all_templates'),
      t('feature_advanced_analytics'),
      t('feature_priority_support'),
      t('feature_custom_domain'),
      t('feature_seo_tools'),
      t('feature_social_integration'),
    ],
    color: 'primary',
    popular: true,
  },
  {
    id: 'enterprise',
    name: t('plan_enterprise'),
    price: { monthly: 199, yearly: 1990 },
    description: t('plan_enterprise_desc'),
    features: [
      t('feature_unlimited_stores'),
      t('feature_unlimited_products'),
      t('feature_premium_templates'),
      t('feature_ai_analytics'),
      t('feature_dedicated_support'),
      t('feature_white_label'),
      t('feature_api_access'),
      t('feature_advanced_security'),
      t('feature_team_management'),
      t('feature_custom_integrations'),
    ],
    color: 'warning',
    popular: false,
  },
];

// ----------------------------------------------------------------------

export default function HomePricingNew() {
  const theme = useTheme();
  const [isYearly, setIsYearly] = useState(false);

  const handleToggle = () => {
    setIsYearly(!isYearly);
  };

  return (
    <Box
      sx={{
        py: { xs: 10, md: 15 },
        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
      }}
    >
      <Container component={MotionViewport}>
        <Stack spacing={3} sx={{ textAlign: 'center', mb: { xs: 5, md: 8 } }}>
          <m.div variants={varFade().inUp}>
            <Typography component="div" variant="overline" sx={{ color: 'text.disabled' }}>
              {t('pricing')}
            </Typography>
          </m.div>

          <m.div variants={varFade().inDown}>
            <Typography variant="h2">{t('choose_perfect_plan')}</Typography>
          </m.div>

          <m.div variants={varFade().inDown}>
            <Typography sx={{ color: 'text.secondary' }}>
              {t('flexible_pricing_desc')}
            </Typography>
          </m.div>

          {/* Billing Toggle */}
          <m.div variants={varFade().inUp}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={2}
              sx={{ mt: 3 }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: !isYearly ? 'text.primary' : 'text.secondary',
                  fontWeight: !isYearly ? 'bold' : 'normal',
                }}
              >
                {t('monthly')}
              </Typography>
              <Switch checked={isYearly} onChange={handleToggle} color="primary" />
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: isYearly ? 'text.primary' : 'text.secondary',
                    fontWeight: isYearly ? 'bold' : 'normal',
                  }}
                >
                  {t('yearly')}
                </Typography>
                <Box
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: 'success.main',
                    color: 'success.contrastText',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    {t('save_17')}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </m.div>
        </Stack>

        {/* Pricing Cards */}
        <Box
          gap={{ xs: 3, lg: 4 }}
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            md: 'repeat(3, 1fr)',
          }}
        >
          {PRICING_PLANS.map((plan, index) => (
            <m.div
              key={plan.id}
              variants={varFade().inUp}
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <Card
                sx={{
                  p: 5,
                  height: 1,
                  position: 'relative',
                  boxShadow: plan.popular ? theme.customShadows.z24 : theme.customShadows.card,
                  border: (theme) =>
                    plan.popular
                      ? `2px solid ${theme.palette[plan.color].main}`
                      : `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.customShadows.z24,
                  },
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      px: 3,
                      py: 0.75,
                      borderRadius: 2,
                      bgcolor: `${plan.color}.main`,
                      color: `${plan.color}.contrastText`,
                      boxShadow: theme.customShadows.z8,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      {t('most_popular')}
                    </Typography>
                  </Box>
                )}

                <Stack spacing={4}>
                  {/* Plan Header */}
                  <Stack spacing={2}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: (theme) =>
                          `linear-gradient(135deg, ${alpha(
                            theme.palette[plan.color].main,
                            0.2
                          )}, ${alpha(theme.palette[plan.color].dark, 0.2)})`,
                      }}
                    >
                      <Iconify
                        icon={
                          plan.id === 'starter'
                            ? 'mdi:rocket-launch'
                            : plan.id === 'professional'
                            ? 'mdi:star-circle'
                            : 'mdi:crown'
                        }
                        width={32}
                        sx={{ color: `${plan.color}.main` }}
                      />
                    </Box>

                    <Typography variant="h4">{plan.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {plan.description}
                    </Typography>
                  </Stack>

                  {/* Price */}
                  <Stack direction="row" alignItems="baseline" spacing={1}>
                    <Typography variant="h3" sx={{ color: `${plan.color}.main` }}>
                      ${isYearly ? plan.price.yearly : plan.price.monthly}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      / {isYearly ? t('year') : t('month')}
                    </Typography>
                  </Stack>

                  {/* Yearly Savings */}
                  {isYearly && (
                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                      {t('save')} ${plan.price.monthly * 12 - plan.price.yearly} {t('per_year')}
                    </Typography>
                  )}

                  <Divider sx={{ borderStyle: 'dashed' }} />

                  {/* Features */}
                  <Stack spacing={2}>
                    {plan.features.map((feature, idx) => (
                      <Stack key={idx} direction="row" alignItems="center" spacing={2}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: (theme) => alpha(theme.palette[plan.color].main, 0.16),
                          }}
                        >
                          <Iconify
                            icon="mdi:check"
                            width={14}
                            sx={{ color: `${plan.color}.main` }}
                          />
                        </Box>
                        <Typography variant="body2">{feature}</Typography>
                      </Stack>
                    ))}
                  </Stack>

                  {/* CTA Button */}
                  <Button
                    size="large"
                    variant={plan.popular ? 'contained' : 'outlined'}
                    color={plan.color}
                    sx={{
                      mt: 'auto',
                      ...(plan.popular && {
                        boxShadow: theme.customShadows[plan.color],
                      }),
                    }}
                  >
                    {t('get_started')}
                  </Button>
                </Stack>
              </Card>
            </m.div>
          ))}
        </Box>

        {/* FAQ Section */}
        <m.div variants={varFade().inUp}>
          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              {t('have_questions')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              {t('contact_sales_desc')}
            </Typography>
            <Button
              size="large"
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="mdi:email-outline" />}
            >
              {t('contact_sales')}
            </Button>
          </Box>
        </m.div>
      </Container>
    </Box>
  );
}
