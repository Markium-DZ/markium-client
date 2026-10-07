import { memo } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { fNumber } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const PRICE_COL_WIDTH = { xs: 'auto', sm: 120 };

function PriceCell({ value, icon, label, currency }) {
  const isSet = value !== null && value !== undefined;
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.5}
      sx={{ width: PRICE_COL_WIDTH, flexShrink: 0, justifyContent: { sm: 'flex-end' } }}
    >
      <Iconify
        icon={icon}
        width={16}
        aria-label={label}
        sx={{ color: 'text.disabled', display: { sm: 'none' } }}
      />
      {isSet ? (
        <Typography variant="body2" fontWeight={600} noWrap>
          {fNumber(value)} {currency}
        </Typography>
      ) : null}
    </Stack>
  );
}

PriceCell.propTypes = {
  currency: PropTypes.string,
  icon: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.number,
};

// ----------------------------------------------------------------------

function CommuneRow({ commune, checked, onToggle, onEdit }) {
  const { t } = useTranslate();
  const currency = t('currency_symbol');

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{
        pl: { xs: 0.5, sm: 4 },
        pr: { xs: 1.5, sm: 2.5 },
        minHeight: 52,
        borderTop: (theme) => `1px dashed ${theme.palette.divider}`,
        ...(checked && {
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
        }),
      }}
    >
      <Checkbox
        size="small"
        checked={checked}
        onChange={() => onToggle(commune.id)}
        inputProps={{ 'aria-label': commune.label }}
      />

      <ButtonBase
        onClick={() => onEdit(commune.id)}
        sx={{
          flexGrow: 1,
          minWidth: 0,
          py: 1,
          pl: 0.5,
          borderRadius: 1,
          justifyContent: 'flex-start',
          textAlign: 'start',
          '&:hover .edit-icon': { opacity: 1 },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={{ xs: 0.5, sm: 2 }}
          sx={{ width: 1, minWidth: 0 }}
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={{ flexGrow: 1, minWidth: 0 }}
          >
            <Typography variant="body2" noWrap>
              {commune.label}
            </Typography>
            <Iconify
              className="edit-icon"
              icon="solar:pen-bold"
              width={14}
              sx={{ color: 'text.disabled', opacity: { xs: 0.6, md: 0 }, flexShrink: 0 }}
            />
          </Stack>

          {commune.priced ? (
            <Stack direction="row" spacing={{ xs: 2, sm: 0 }} alignItems="center">
              <PriceCell
                value={commune.home_price}
                icon="solar:home-2-bold-duotone"
                label={t('shipping_prices_home')}
                currency={currency}
              />
              <PriceCell
                value={commune.desk_price}
                icon="solar:shop-2-bold-duotone"
                label={t('shipping_prices_desk')}
                currency={currency}
              />
            </Stack>
          ) : (
            <Box
              sx={{
                width: { xs: 'auto', sm: 240 },
                display: 'flex',
                justifyContent: { sm: 'flex-end' },
                flexShrink: 0,
              }}
            >
              <Chip
                size="small"
                variant="soft"
                color="warning"
                label={t('shipping_prices_not_set')}
              />
            </Box>
          )}
        </Stack>
      </ButtonBase>
    </Stack>
  );
}

CommuneRow.propTypes = {
  checked: PropTypes.bool,
  commune: PropTypes.object,
  onEdit: PropTypes.func,
  onToggle: PropTypes.func,
};

// ----------------------------------------------------------------------

function ShippingPricesWilayaGroup({
  group,
  communes,
  expanded,
  selectedCount,
  onToggleExpand,
  onToggleGroup,
  onToggleCommune,
  onEditCommune,
  selected,
}) {
  const { t } = useTranslate();

  const visibleCount = communes.length;
  const allSelected = visibleCount > 0 && selectedCount === visibleCount;
  const someSelected = selectedCount > 0 && selectedCount < visibleCount;
  const fullyPriced = group.pricedCount === group.totalCount;
  let chipColor = 'default';
  if (fullyPriced) chipColor = 'success';
  else if (group.pricedCount) chipColor = 'info';

  return (
    <Box sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
      {/* Wilaya header */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          pl: 0.5,
          pr: { xs: 1, sm: 2 },
          minHeight: 56,
          bgcolor: expanded ? 'background.neutral' : 'transparent',
        }}
      >
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          disabled={!visibleCount}
          onChange={(event) => onToggleGroup(group.id, event.target.checked)}
          inputProps={{
            'aria-label': t('shipping_prices_select_wilaya', { name: group.label }),
          }}
        />

        <ButtonBase
          onClick={() => onToggleExpand(group.id)}
          aria-expanded={expanded}
          sx={{
            flexGrow: 1,
            minWidth: 0,
            py: 1.25,
            px: 0.5,
            borderRadius: 1,
            justifyContent: 'space-between',
            textAlign: 'start',
            gap: 1,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
            {group.code ? (
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', fontWeight: 700, minWidth: 20, flexShrink: 0 }}
              >
                {group.code}
              </Typography>
            ) : null}
            <Typography variant="subtitle2" noWrap>
              {group.label}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
            <Chip
              size="small"
              variant="soft"
              color={chipColor}
              label={t('shipping_prices_n_priced', {
                priced: group.pricedCount,
                total: group.totalCount,
              })}
            />
            <Iconify
              icon="eva:arrow-ios-downward-fill"
              width={18}
              sx={{
                color: 'text.secondary',
                transition: (theme) => theme.transitions.create('transform'),
                transform: expanded ? 'rotate(180deg)' : 'none',
              }}
            />
          </Stack>
        </ButtonBase>
      </Stack>

      {/* Communes — not rendered at all while collapsed */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {communes.map((commune) => (
          <CommuneRow
            key={commune.id}
            commune={commune}
            checked={selected.has(commune.id)}
            onToggle={onToggleCommune}
            onEdit={onEditCommune}
          />
        ))}
      </Collapse>
    </Box>
  );
}

ShippingPricesWilayaGroup.propTypes = {
  communes: PropTypes.array,
  expanded: PropTypes.bool,
  group: PropTypes.object,
  onEditCommune: PropTypes.func,
  onToggleCommune: PropTypes.func,
  onToggleExpand: PropTypes.func,
  onToggleGroup: PropTypes.func,
  selected: PropTypes.instanceOf(Set),
  selectedCount: PropTypes.number,
};

// Re-render a group only when its own data / selection / expansion changes
export default memo(
  ShippingPricesWilayaGroup,
  (prev, next) =>
    prev.group === next.group &&
    prev.communes === next.communes &&
    prev.expanded === next.expanded &&
    prev.selectedCount === next.selectedCount &&
    prev.onToggleExpand === next.onToggleExpand &&
    prev.onToggleGroup === next.onToggleGroup &&
    prev.onToggleCommune === next.onToggleCommune &&
    prev.onEditCommune === next.onEditCommune &&
    // selection inside an expanded group must re-render its rows
    (!next.expanded || prev.selected === next.selected)
);
