import { useMemo, useState, useCallback, useDeferredValue } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import showError from 'src/utils/show_error';

import { useTranslate } from 'src/locales';
import { NAV_HEIGHT } from 'src/layouts/dashboard/bottom-nav';
import { useGetWilayas, useGetCommunes } from 'src/api/settings';
import {
  bulkSetShippingRates,
  bulkClearShippingRates,
  useGetCommuneShippingRates,
} from 'src/api/shipping';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { TableNoData, TableSkeleton } from 'src/components/table';

import ShippingPricesDialog from './shipping-prices-dialog';
import ShippingPricesWilayaGroup from './shipping-prices-wilaya-group';

// ----------------------------------------------------------------------

// When a search / filter narrows the list to this many communes or fewer,
// matching wilaya groups open automatically. Above it, groups stay collapsed
// so we never render all 1,541 rows at once.
const AUTO_EXPAND_LIMIT = 150;

const isNil = (value) => value === null || value === undefined;

const toNumberOrNull = (value) => (isNil(value) || value === '' ? null : Number(value));

// Lower-case, strip Latin diacritics and Arabic tashkeel for forgiving search
function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ً-ٰٟ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .toLowerCase()
    .trim();
}

function localName(item, lang) {
  if (!item) return '';
  if (lang.startsWith('ar')) return item.name_ar || item.name || item.name_en || '';
  if (lang.startsWith('en')) return item.name_en || item.name || item.name_ar || '';
  return item.name || item.name_en || item.name_ar || '';
}

// ----------------------------------------------------------------------

export default function ShippingPricesForm() {
  const { t, i18n } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();

  const lang = i18n?.language || 'ar';

  const { wilayas, wilayasLoading, wilayasError, mutate: mutateWilayas } = useGetWilayas();
  const { communes, communesLoading, communesError, mutate: mutateCommunes } = useGetCommunes();
  const { rates, ratesLoading, ratesError, mutate: mutateRates } = useGetCommuneShippingRates();

  const [search, setSearch] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState('');
  const [unpricedOnly, setUnpricedOnly] = useState(false);

  const [selected, setSelected] = useState(() => new Set());
  const [expanded, setExpanded] = useState(() => new Set());
  // Groups the user explicitly closed while auto-expand is active
  const [collapsedOverride, setCollapsedOverride] = useState(() => new Set());

  const [editIds, setEditIds] = useState(null); // array of commune ids or null
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const deferredSearch = useDeferredValue(search);

  const loading = wilayasLoading || communesLoading || ratesLoading;
  const error = wilayasError || communesError || ratesError;

  // ---- Join: communes + wilayas + rates -------------------------------

  const { groups, communeById, totalCount, pricedTotal } = useMemo(() => {
    const rateByCommune = new Map();
    rates.forEach((rate) => rateByCommune.set(rate.commune_id, rate));

    const wilayaById = new Map();
    wilayas.forEach((wilaya) => wilayaById.set(wilaya.id, wilaya));

    const byId = new Map();
    const grouped = new Map();
    let priced = 0;

    communes.forEach((commune) => {
      const wilaya = wilayaById.get(commune.wilaya_id);
      const rate = rateByCommune.get(commune.id);
      const homePrice = toNumberOrNull(rate?.home_price);
      const deskPrice = toNumberOrNull(rate?.desk_price);
      const isPriced = homePrice !== null && deskPrice !== null;
      if (isPriced) priced += 1;

      const row = {
        id: commune.id,
        wilaya_id: commune.wilaya_id,
        label: localName(commune, lang),
        home_price: homePrice,
        desk_price: deskPrice,
        priced: isPriced,
        haystack: normalize(
          [
            commune.name,
            commune.name_ar,
            commune.name_en,
            wilaya?.name,
            wilaya?.name_ar,
            wilaya?.name_en,
          ].join(' ')
        ),
      };
      byId.set(row.id, row);

      if (!grouped.has(commune.wilaya_id)) grouped.set(commune.wilaya_id, []);
      grouped.get(commune.wilaya_id).push(row);
    });

    const collator = new Intl.Collator(lang);

    const list = Array.from(grouped.entries()).map(([wilayaId, rows]) => {
      const wilaya = wilayaById.get(wilayaId);
      rows.sort((a, b) => collator.compare(a.label, b.label));
      return {
        id: wilayaId,
        code: wilaya?.code ? String(wilaya.code) : '',
        label: localName(wilaya, lang) || `#${wilayaId}`,
        communes: rows,
        totalCount: rows.length,
        pricedCount: rows.filter((r) => r.priced).length,
      };
    });

    list.sort((a, b) => {
      const ca = parseInt(a.code, 10);
      const cb = parseInt(b.code, 10);
      if (!Number.isNaN(ca) && !Number.isNaN(cb) && ca !== cb) return ca - cb;
      return a.id - b.id;
    });

    return { groups: list, communeById: byId, totalCount: communes.length, pricedTotal: priced };
  }, [communes, wilayas, rates, lang]);

  // ---- Filtering ------------------------------------------------------

  const query = normalize(deferredSearch);

  const filteredGroups = useMemo(
    () =>
      groups
        .filter((group) => !wilayaFilter || group.id === wilayaFilter)
        .map((group) => {
          const rows = group.communes.filter(
            (row) => (!unpricedOnly || !row.priced) && (!query || row.haystack.includes(query))
          );
          // keep the same array identity when nothing was filtered out (memoized groups)
          return { group, communes: rows.length === group.communes.length ? group.communes : rows };
        })
        .filter((entry) => entry.communes.length > 0),
    [groups, wilayaFilter, unpricedOnly, query]
  );

  const filteredCount = useMemo(
    () => filteredGroups.reduce((sum, entry) => sum + entry.communes.length, 0),
    [filteredGroups]
  );

  const isFiltering = !!query || !!wilayaFilter || unpricedOnly;
  const autoExpand = isFiltering && filteredCount <= AUTO_EXPAND_LIMIT;

  const isExpanded = useCallback(
    (groupId) => (autoExpand ? !collapsedOverride.has(groupId) : expanded.has(groupId)),
    [autoExpand, collapsedOverride, expanded]
  );

  // ---- Handlers -------------------------------------------------------

  const handleToggleExpand = useCallback(
    (groupId) => {
      if (autoExpand) {
        setCollapsedOverride((prev) => {
          const next = new Set(prev);
          if (next.has(groupId)) next.delete(groupId);
          else next.add(groupId);
          return next;
        });
      } else {
        setExpanded((prev) => {
          const next = new Set(prev);
          if (next.has(groupId)) next.delete(groupId);
          else next.add(groupId);
          return next;
        });
      }
    },
    [autoExpand]
  );

  const handleToggleCommune = useCallback((communeId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(communeId)) next.delete(communeId);
      else next.add(communeId);
      return next;
    });
  }, []);

  // Wilaya checkbox acts on the communes currently visible in that group
  // (so "Unpriced only" + wilaya checkbox = select that wilaya's gaps).
  const visibleByGroup = useMemo(() => {
    const map = new Map();
    filteredGroups.forEach((entry) => map.set(entry.group.id, entry.communes));
    return map;
  }, [filteredGroups]);

  const handleToggleGroup = useCallback(
    (groupId, checked) => {
      const rows = visibleByGroup.get(groupId) || [];
      setSelected((prev) => {
        const next = new Set(prev);
        rows.forEach((row) => {
          if (checked) next.add(row.id);
          else next.delete(row.id);
        });
        return next;
      });
    },
    [visibleByGroup]
  );

  const handleRetry = useCallback(() => {
    mutateWilayas();
    mutateCommunes();
    mutateRates();
  }, [mutateWilayas, mutateCommunes, mutateRates]);

  const handleEditCommune = useCallback((communeId) => setEditIds([communeId]), []);

  const handleClearSelection = useCallback(() => setSelected(new Set()), []);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setWilayaFilter('');
    setUnpricedOnly(false);
  }, []);

  // ---- Dialog prefill -------------------------------------------------

  const dialogInfo = useMemo(() => {
    if (!editIds?.length) return { home: null, desk: null, name: '' };
    const rows = editIds.map((id) => communeById.get(id)).filter(Boolean);
    const first = rows[0];
    const shared =
      first &&
      first.priced &&
      rows.every((r) => r.home_price === first.home_price && r.desk_price === first.desk_price);
    return {
      home: shared ? first.home_price : null,
      desk: shared ? first.desk_price : null,
      name: rows.length === 1 ? first?.label || '' : '',
    };
  }, [editIds, communeById]);

  const handleSubmitPrices = useCallback(
    async ({ home_price, desk_price }) => {
      const ids = editIds || [];
      try {
        const response = await bulkSetShippingRates({ commune_ids: ids, home_price, desk_price });
        await mutateRates();
        const count = response?.data?.data?.updated ?? ids.length;
        enqueueSnackbar(t('shipping_prices_saved', { count }), { variant: 'success' });
        setEditIds(null);
        // Job done for these communes — drop them from the selection
        setSelected((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      } catch (err) {
        showError(err);
      }
    },
    [editIds, mutateRates, enqueueSnackbar, t]
  );

  const handleClearPrices = useCallback(async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setClearing(true);
    try {
      await bulkClearShippingRates(ids);
      await mutateRates();
      enqueueSnackbar(t('shipping_prices_cleared', { count: ids.length }), { variant: 'success' });
      setConfirmClear(false);
      setSelected(new Set());
    } catch (err) {
      showError(err);
    } finally {
      setClearing(false);
    }
  }, [selected, mutateRates, enqueueSnackbar, t]);

  // Selected count per group (cheap: one pass over the selection)
  const selectedCountByGroup = useMemo(() => {
    const map = new Map();
    visibleByGroup.forEach((rows, groupId) => {
      let n = 0;
      rows.forEach((row) => {
        if (selected.has(row.id)) n += 1;
      });
      map.set(groupId, n);
    });
    return map;
  }, [visibleByGroup, selected]);

  const selectedCount = selected.size;

  // ---- Render ---------------------------------------------------------

  const renderToolbar = (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'stretch', md: 'center' }}
      sx={{ p: { xs: 2, sm: 2.5 } }}
    >
      <TextField
        size="small"
        fullWidth
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('shipping_prices_search')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
          endAdornment: search ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearch('')} aria-label={t('clear')}>
                <Iconify icon="mingcute:close-line" width={16} />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
        <TextField
          select
          size="small"
          value={wilayaFilter}
          onChange={(event) => setWilayaFilter(event.target.value)}
          label={t('wilaya')}
          SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 320 } } } }}
          sx={{ flexGrow: 1, minWidth: { md: 200 } }}
        >
          <MenuItem value="">{t('shipping_prices_all_wilayas')}</MenuItem>
          {groups.map((group) => (
            <MenuItem key={group.id} value={group.id}>
              {group.code ? `${group.code} - ` : ''}
              {group.label}
            </MenuItem>
          ))}
        </TextField>

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={unpricedOnly}
              onChange={(event) => setUnpricedOnly(event.target.checked)}
            />
          }
          label={
            <Typography variant="body2" noWrap>
              {t('shipping_prices_unpriced_only')}
            </Typography>
          }
          sx={{ mx: 0, flexShrink: 0 }}
        />
      </Stack>
    </Stack>
  );

  const progress = totalCount ? (pricedTotal / totalCount) * 100 : 0;

  const renderCounter = (
    <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
        <Typography variant="subtitle2">
          {t('shipping_prices_priced_count', { count: pricedTotal, total: totalCount })}
        </Typography>
        {isFiltering ? (
          <Button size="small" color="inherit" onClick={handleResetFilters}>
            {t('clear')}
          </Button>
        ) : null}
      </Stack>
      <LinearProgress
        variant="determinate"
        value={progress}
        color={progress === 100 ? 'success' : 'primary'}
        sx={{ height: 6, borderRadius: 1 }}
      />
    </Box>
  );

  const renderList = () => {
    if (loading) {
      return (
        <Table>
          <TableBody>
            {[...Array(6)].map((_, index) => (
              <TableSkeleton key={index} sx={{ height: 56 }} />
            ))}
          </TableBody>
        </Table>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 2.5 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                {t('retry')}
              </Button>
            }
          >
            {t('shipping_prices_load_error')}
          </Alert>
        </Box>
      );
    }

    if (!filteredGroups.length) {
      return (
        <Table>
          <TableBody>
            <TableNoData notFound />
          </TableBody>
        </Table>
      );
    }

    return filteredGroups.map(({ group, communes: rows }) => (
      <ShippingPricesWilayaGroup
        key={group.id}
        group={group}
        communes={rows}
        expanded={isExpanded(group.id)}
        selected={selected}
        selectedCount={selectedCountByGroup.get(group.id) || 0}
        onToggleExpand={handleToggleExpand}
        onToggleGroup={handleToggleGroup}
        onToggleCommune={handleToggleCommune}
        onEditCommune={handleEditCommune}
      />
    ));
  };

  const renderActionBar = selectedCount > 0 && (
    <Box
      sx={{
        position: 'sticky',
        zIndex: (theme) => theme.zIndex.appBar - 1,
        // Sit above the mobile bottom nav (shown below lg)
        bottom: {
          xs: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom) + 8px)`,
          lg: 16,
        },
        mt: 2,
      }}
    >
      <Card
        sx={{
          px: { xs: 1.5, sm: 2.5 },
          py: 1.25,
          bgcolor: 'grey.800',
          color: 'common.white',
          boxShadow: (theme) => theme.customShadows?.z20 || theme.shadows[12],
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <IconButton
            size="small"
            onClick={handleClearSelection}
            aria-label={t('shipping_prices_clear_selection')}
            sx={{ color: 'inherit' }}
          >
            <Iconify icon="mingcute:close-line" width={18} />
          </IconButton>

          <Typography variant="subtitle2" sx={{ flexGrow: 1, whiteSpace: 'nowrap' }}>
            {t('shipping_prices_selected', { count: selectedCount })}
          </Typography>

          <Button
            size="small"
            color="inherit"
            onClick={() => setConfirmClear(true)}
            startIcon={<Iconify icon="solar:eraser-bold" width={18} />}
            sx={{ color: 'grey.400' }}
          >
            {t('shipping_prices_clear')}
          </Button>

          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => setEditIds(Array.from(selected))}
            startIcon={<Iconify icon="solar:tag-price-bold" width={18} />}
          >
            {t('shipping_prices_set')}
          </Button>
        </Stack>
      </Card>
    </Box>
  );

  return (
    <Box>
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant="h6">{t('shipping_prices')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('shipping_prices_description')}
        </Typography>
      </Stack>

      <Card variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {renderToolbar}
        {!loading && !error && renderCounter}

        {/* Column header (desktop only) */}
        {!loading && !error && filteredGroups.length > 0 && (
          <Stack
            direction="row"
            alignItems="center"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              pl: 7.5,
              pr: 2.5,
              py: 1,
              bgcolor: 'background.neutral',
              typography: 'caption',
              fontWeight: 600,
              color: 'text.secondary',
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Box sx={{ flexGrow: 1 }}>
              {t('wilaya')} / {t('commune')}
            </Box>
            <Box sx={{ width: 120, textAlign: 'end' }}>{t('shipping_prices_home')}</Box>
            <Box sx={{ width: 120, textAlign: 'end' }}>{t('shipping_prices_desk')}</Box>
          </Stack>
        )}

        {renderList()}
      </Card>

      {renderActionBar}

      <ShippingPricesDialog
        open={!!editIds}
        onClose={() => setEditIds(null)}
        onSubmit={handleSubmitPrices}
        count={editIds?.length || 0}
        communeName={dialogInfo.name}
        initialHome={dialogInfo.home}
        initialDesk={dialogInfo.desk}
      />

      <ConfirmDialog
        open={confirmClear}
        onClose={() => !clearing && setConfirmClear(false)}
        title={t('shipping_prices_clear_title')}
        content={t('shipping_prices_clear_confirm', { count: selectedCount })}
        action={
          <LoadingButton
            variant="contained"
            color="error"
            loading={clearing}
            onClick={handleClearPrices}
          >
            {t('shipping_prices_clear')}
          </LoadingButton>
        }
      />
    </Box>
  );
}
