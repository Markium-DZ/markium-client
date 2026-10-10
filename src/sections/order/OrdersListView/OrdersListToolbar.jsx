import PropTypes from 'prop-types';

import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';

import { DATE_PRESETS } from '../utils/order-date-range';

// ----------------------------------------------------------------------

export const ORDER_TABS = [
  { key: 'all', labelKey: 'all' },
  { key: 'today', labelKey: 'today', color: 'primary' },
  { key: 'pending', labelKey: 'pending', color: 'warning' },
  { key: 'confirmed', labelKey: 'confirmed', color: 'secondary' },
  { key: 'shipped', labelKey: 'shipped', color: 'info' },
  { key: 'delivered', labelKey: 'delivered', color: 'success' },
  { key: 'cancelled', labelKey: 'cancelled', color: 'error' },
];

const PRESET_LABEL_KEYS = {
  all: 'orders_date_all',
  today: 'orders_date_today',
  yesterday: 'orders_date_yesterday',
  last_7_days: 'orders_date_last_7_days',
  this_month: 'orders_date_this_month',
  custom: 'orders_date_custom',
};

// ----------------------------------------------------------------------

export default function OrdersListToolbar({
  tab,
  onTabChange,
  total,
  search,
  onSearchChange,
  datePreset,
  onDatePresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}) {
  const { t } = useTranslate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // The "today" tab already pins the date to today — the date filter is locked meanwhile.
  const dateLocked = tab === 'today';
  const size = isMobile ? 'small' : 'medium';

  const renderTabs = isMobile ? (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{
        px: 1.5,
        py: 1,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {ORDER_TABS.map((item) => {
        const isActive = item.key === tab;
        return (
          <Chip
            key={item.key}
            label={isActive && total != null ? `${t(item.labelKey)} ${total}` : t(item.labelKey)}
            size="small"
            color={isActive ? item.color || 'primary' : 'default'}
            variant={isActive ? 'filled' : 'outlined'}
            onClick={() => onTabChange(item.key)}
            sx={{ flexShrink: 0, fontWeight: isActive ? 600 : 400, height: 30, borderRadius: '8px' }}
          />
        );
      })}
    </Stack>
  ) : (
    <Tabs
      value={tab}
      onChange={(event, value) => onTabChange(value)}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      sx={{ px: 2.5, boxShadow: `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}` }}
    >
      {ORDER_TABS.map((item) => (
        <Tab
          key={item.key}
          value={item.key}
          iconPosition="end"
          label={t(item.labelKey)}
          icon={
            item.key === tab && total != null ? (
              <Label variant="filled" color={item.color || 'default'}>
                {total}
              </Label>
            ) : undefined
          }
        />
      ))}
    </Tabs>
  );

  return (
    <>
      {renderTabs}

      <Stack
        spacing={{ xs: 1, md: 2 }}
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        sx={{ p: { xs: 1.5, md: 2.5 } }}
      >
        <TextField
          fullWidth
          size={size}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('orders_search_placeholder')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')} aria-label={t('clear')}>
                  <Iconify icon="eva:close-fill" width={18} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        <TextField
          select
          size={size}
          label={t('orders_date_filter')}
          value={dateLocked ? 'today' : datePreset}
          disabled={dateLocked}
          onChange={(event) => onDatePresetChange(event.target.value)}
          sx={{ minWidth: { md: 200 }, flexShrink: 0 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:calendar-date-bold" width={20} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        >
          {DATE_PRESETS.map((preset) => (
            <MenuItem key={preset} value={preset}>
              {t(PRESET_LABEL_KEYS[preset])}
            </MenuItem>
          ))}
        </TextField>

        {!dateLocked && datePreset === 'custom' && (
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <DatePicker
              label={t('orders_date_from')}
              value={customFrom}
              onChange={onCustomFromChange}
              maxDate={customTo || undefined}
              disableFuture
              slotProps={{ textField: { size, sx: { width: { xs: 1, md: 170 } } } }}
            />
            <DatePicker
              label={t('orders_date_to')}
              value={customTo}
              onChange={onCustomToChange}
              minDate={customFrom || undefined}
              disableFuture
              slotProps={{ textField: { size, sx: { width: { xs: 1, md: 170 } } } }}
            />
          </Stack>
        )}
      </Stack>
    </>
  );
}

OrdersListToolbar.propTypes = {
  tab: PropTypes.string,
  onTabChange: PropTypes.func,
  total: PropTypes.number,
  search: PropTypes.string,
  onSearchChange: PropTypes.func,
  datePreset: PropTypes.string,
  onDatePresetChange: PropTypes.func,
  customFrom: PropTypes.instanceOf(Date),
  customTo: PropTypes.instanceOf(Date),
  onCustomFromChange: PropTypes.func,
  onCustomToChange: PropTypes.func,
};
