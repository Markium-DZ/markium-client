import PropTypes from 'prop-types';
import { Card, Stack, Typography, Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ProfitabilitySummaryCards({ cards }) {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{
        xs: 'repeat(1, 1fr)',
        sm: 'repeat(2, 1fr)',
        md: `repeat(${Math.min(cards.length, 4)}, 1fr)`,
      }}
      gap={2.5}
    >
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </Box>
  );
}

function SummaryCard({ title, value, suffix, icon, color = 'primary' }) {
  const theme = useTheme();
  const mainColor = theme.palette[color]?.main || theme.palette.primary.main;
  const darkColor = theme.palette[color]?.darker || mainColor;

  return (
    <Card
      sx={{
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 12px 24px -4px ${alpha(mainColor, 0.16)}`,
        },
      }}
    >
      {/* Decorative background circles */}
      <Box
        sx={{
          position: 'absolute',
          top: -24,
          right: -24,
          width: 96,
          height: 96,
          borderRadius: '50%',
          bgcolor: alpha(mainColor, 0.06),
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: -8,
          right: -8,
          width: 56,
          height: 56,
          borderRadius: '50%',
          bgcolor: alpha(mainColor, 0.1),
        }}
      />

      <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1.5,
            background: `linear-gradient(135deg, ${alpha(mainColor, 0.16)} 0%, ${alpha(mainColor, 0.04)} 100%)`,
            border: `1px solid ${alpha(mainColor, 0.12)}`,
          }}
        >
          <Iconify icon={icon} width={26} sx={{ color: darkColor }} />
        </Box>

        <Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              mb: 0.5,
            }}
          >
            {typeof value === 'number'
              ? value.toLocaleString('fr-DZ', { minimumFractionDigits: value % 1 !== 0 ? 1 : 0 })
              : value}
            {suffix && (
              <Typography
                component="span"
                variant="subtitle1"
                sx={{ ml: 0.5, fontWeight: 500, color: 'text.secondary' }}
              >
                {suffix}
              </Typography>
            )}
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {title}
          </Typography>
        </Box>
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
