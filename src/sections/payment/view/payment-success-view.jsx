import { m } from 'framer-motion';
import { t } from 'i18next';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { OrderCompleteIllustration } from 'src/assets/illustrations';

import { varBounce, MotionContainer } from 'src/components/animate';

// ----------------------------------------------------------------------

export default function PaymentSuccessView() {
  return (
    <MotionContainer>
      <m.div variants={varBounce().in}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          {t('payment_success_title')}
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        <Typography sx={{ color: 'text.secondary' }}>
          {t('payment_success_description')}
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        <OrderCompleteIllustration
          sx={{
            height: 260,
            my: { xs: 5, sm: 10 },
          }}
        />
      </m.div>

      <Button component={RouterLink} href={paths.dashboard.root} size="large" variant="contained">
        {t('go_to_dashboard')}
      </Button>
    </MotionContainer>
  );
}
