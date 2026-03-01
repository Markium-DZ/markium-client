import PropTypes from 'prop-types';
import { Card, Stack, Typography, Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ProfitabilitySummaryCards({ cards }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </Stack>
  );
}

function SummaryCard({ title, value, suffix, icon, color = 'primary' }) {
  const theme = useTheme();
  const mainColor = theme.palette[color]?.main || theme.palette.primary.main;

  return (
    <Card sx={{ p: 3, flex: 1 }}>
      <Stack spacing={1}>
        <Box
          sx={{
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            bgcolor: alpha(mainColor, 0.08),
          }}
        >
          <Iconify icon={icon} width={24} sx={{ color: mainColor }} />
        </Box>
        <Typography variant="h4">
          {typeof value === 'number'
            ? value.toLocaleString('fr-DZ', { minimumFractionDigits: value % 1 !== 0 ? 1 : 0 })
            : value}
          {suffix && (
            <Typography component="span" variant="subtitle2" sx={{ ml: 0.5 }}>
              {suffix}
            </Typography>
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Stack>
    </Card>
  );
}

ProfitabilitySummaryCards.propTypes = {
  cards: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      suffix: PropTypes.string,
      icon: PropTypes.string.isRequired,
      color: PropTypes.string,
    })
  ).isRequired,
};

SummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  suffix: PropTypes.string,
  icon: PropTypes.string.isRequired,
  color: PropTypes.string,
};
