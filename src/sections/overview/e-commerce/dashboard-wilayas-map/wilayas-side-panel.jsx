import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function WilayasSidePanel({ wilayas }) {
  const { t } = useTranslate();

  const withOrders = wilayas.filter((w) => (w.orderCount || 0) > 0);

  const topByOrders = [...withOrders]
    .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
    .slice(0, 5);

  const watchlist = [...withOrders]
    .filter((w) => (w.returnRate || 0) > 0 && (w.orderCount || 0) >= 3)
    .sort((a, b) => (b.returnRate || 0) - (a.returnRate || 0))
    .slice(0, 4);

  const maxOrders = Math.max(1, ...topByOrders.map((w) => w.orderCount || 0));

  return (
    <Stack spacing={3} sx={{ height: '100%' }}>
      <Block
        icon="solar:medal-ribbon-star-bold-duotone"
        iconColor="success.main"
        title={t('top_wilayas_by_orders')}
        empty={!topByOrders.length}
        emptyLabel={t('no_orders_in_period')}
      >
        <Stack spacing={1.5}>
          {topByOrders.map((w, idx) => (
            <TopRow
              key={w.code}
              rank={idx + 1}
              nameFr={w.nameFr}
              nameAr={w.nameAr}
              orderCount={w.orderCount}
              fill={w.ordersColor}
              ratio={(w.orderCount || 0) / maxOrders}
            />
          ))}
        </Stack>
      </Block>

      <Block
        icon="solar:danger-triangle-bold-duotone"
        iconColor="error.main"
        title={t('watchlist_high_returns')}
        empty={!watchlist.length}
        emptyLabel={t('no_returns_signal')}
      >
        <Stack spacing={1.25}>
          {watchlist.map((w) => (
            <WatchRow
              key={w.code}
              nameFr={w.nameFr}
              returnRate={w.returnRate}
              returnCount={w.returnCount}
              fill={w.returnsColor}
            />
          ))}
        </Stack>
      </Block>
    </Stack>
  );
}

WilayasSidePanel.propTypes = {
  wilayas: PropTypes.array.isRequired,
};

// ----------------------------------------------------------------------

function Block({ icon, iconColor, title, children, empty, emptyLabel }) {
  return (
    <Stack spacing={1.25}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Iconify icon={icon} width={18} sx={{ color: iconColor }} />
        <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 0.6 }}>
          {title}
        </Typography>
      </Stack>
      {empty ? (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {emptyLabel}
        </Typography>
      ) : (
        children
      )}
    </Stack>
  );
}

Block.propTypes = {
  icon: PropTypes.string.isRequired,
  iconColor: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  empty: PropTypes.bool,
  emptyLabel: PropTypes.string,
};

// ----------------------------------------------------------------------

function TopRow({ rank, nameFr, nameAr, orderCount, fill, ratio }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.5 }}>
        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
            color: 'text.secondary',
            fontWeight: 700,
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          {rank}
        </Box>
        <Stack spacing={0} sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
            {nameFr}
          </Typography>
          {nameAr && (
            <Typography variant="caption" sx={{ color: 'text.disabled', direction: 'rtl', lineHeight: 1.1 }}>
              {nameAr}
            </Typography>
          )}
        </Stack>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, flexShrink: 0 }}>
          {orderCount}
        </Typography>
      </Stack>
      <Box
        sx={{
          ml: '34px',
          height: 6,
          borderRadius: 999,
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${Math.max(6, ratio * 100)}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${fill}55, ${fill})`,
            transition: 'width 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </Box>
    </Box>
  );
}

TopRow.propTypes = {
  rank: PropTypes.number.isRequired,
  nameFr: PropTypes.string.isRequired,
  nameAr: PropTypes.string,
  orderCount: PropTypes.number.isRequired,
  fill: PropTypes.string.isRequired,
  ratio: PropTypes.number.isRequired,
};

// ----------------------------------------------------------------------

function WatchRow({ nameFr, returnRate, returnCount, fill }) {
  const { t } = useTranslate();
  return (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Box
        sx={{
          width: 8,
          height: 24,
          borderRadius: 1,
          bgcolor: fill,
          flexShrink: 0,
        }}
      />
      <Stack spacing={0} sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
          {nameFr}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', lineHeight: 1.1 }}>
          {`${returnCount} ${t('returned_label')}`}
        </Typography>
      </Stack>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          color: 'error.main',
          flexShrink: 0,
        }}
      >
        {`${(returnRate || 0).toFixed(0)}%`}
      </Typography>
    </Stack>
  );
}

WatchRow.propTypes = {
  nameFr: PropTypes.string.isRequired,
  returnRate: PropTypes.number,
  returnCount: PropTypes.number,
  fill: PropTypes.string.isRequired,
};
