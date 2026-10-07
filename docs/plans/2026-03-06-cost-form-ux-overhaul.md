# Cost Form Dialog UX Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Overhaul the "Add Cost" dialog (`cost-form-dialog.jsx`) to fix 12 UX issues: rich cost-type autocomplete with icons/descriptions, rich variant selector with images/option-values, animated conditional sections, card-style scope selector, polished amount field, improved notes, better dialog actions, proper error messages, RTL fixes, accessibility, keyboard shortcuts, and dirty-state warning.

**Architecture:** Single-file rewrite of `cost-form-dialog.jsx` plus additions to `constants.js` (descriptions), `product-costs-view.jsx` (pass `optionDefinitions`), and i18n files (new keys). Uses existing `Autocomplete`, `Collapse`, `InputAdornment` from MUI and existing `Iconify`/`Label` from the component library. No new dependencies.

**Tech Stack:** React 18, MUI v5, react-hook-form + yup, i18next, Iconify

---

## File Inventory

| File | Action |
|---|---|
| `src/sections/product-costs/constants.js` | Modify: add `descriptionKey` to COST_TYPES, `icon` to SCOPE_OPTIONS |
| `src/sections/product-costs/cost-form-dialog.jsx` | Rewrite: all 12 enhancements |
| `src/sections/product-costs/view/product-costs-view.jsx` | Modify: pass `optionDefinitions` prop |
| `src/locales/langs/ar.json` | Modify: add ~20 new i18n keys |
| `src/locales/langs/en.json` | Modify: add ~20 new i18n keys |
| `src/locales/langs/fr.json` | Modify: add ~20 new i18n keys |
| `src/sections/product-costs/cost-row.jsx` | Modify: fix hardcoded `DA`, improve variant display in table |

---

## Task 1: Add description keys to constants and i18n files

**Files:**
- Modify: `src/sections/product-costs/constants.js`
- Modify: `src/locales/langs/ar.json`
- Modify: `src/locales/langs/en.json`
- Modify: `src/locales/langs/fr.json`

**Step 1: Update COST_TYPES with descriptionKey**

In `constants.js`, add a `descriptionKey` field to each entry in `COST_TYPES`:

```js
export const COST_TYPES = [
  { value: 'buy_price', labelKey: 'cost_type_buy_price', descriptionKey: 'cost_type_buy_price_desc', icon: 'solar:tag-price-bold-duotone', color: 'primary', hexColor: '#00A76F' },
  { value: 'marketing', labelKey: 'cost_type_marketing', descriptionKey: 'cost_type_marketing_desc', icon: 'solar:megaphone-bold-duotone', color: 'warning', hexColor: '#FFAB00' },
  { value: 'content', labelKey: 'cost_type_content', descriptionKey: 'cost_type_content_desc', icon: 'solar:pen-new-round-bold-duotone', color: 'info', hexColor: '#00B8D9' },
  { value: 'packaging', labelKey: 'cost_type_packaging', descriptionKey: 'cost_type_packaging_desc', icon: 'solar:box-bold-duotone', color: 'secondary', hexColor: '#8E33FF' },
  { value: 'shipping', labelKey: 'cost_type_shipping', descriptionKey: 'cost_type_shipping_desc', icon: 'solar:delivery-bold-duotone', color: 'success', hexColor: '#22C55E' },
  { value: 'confirmation_call', labelKey: 'cost_type_confirmation_call', descriptionKey: 'cost_type_confirmation_call_desc', icon: 'solar:phone-calling-bold-duotone', color: 'default', hexColor: '#919EAB' },
  { value: 'custom', labelKey: 'cost_type_custom', descriptionKey: 'cost_type_custom_desc', icon: 'solar:settings-bold-duotone', color: 'error', hexColor: '#FF5630' },
];
```

Also add `icon` and `descriptionKey` to `SCOPE_OPTIONS`:

```js
export const SCOPE_OPTIONS = [
  { value: 'per_unit', labelKey: 'scope_per_unit', descriptionKey: 'scope_per_unit_desc', icon: 'solar:box-bold-duotone' },
  { value: 'global', labelKey: 'scope_global', descriptionKey: 'scope_global_desc', icon: 'solar:planet-bold-duotone' },
];
```

**Step 2: Add i18n keys to all 3 locale files**

Add the following keys (near the existing `cost_type_*` keys):

**Arabic (`ar.json`):**
```json
"cost_type_buy_price_desc": "سعر شراء المنتج من المورد",
"cost_type_marketing_desc": "مصاريف الحملات الإعلانية",
"cost_type_content_desc": "تكاليف إنشاء المحتوى والتصميم",
"cost_type_packaging_desc": "تكاليف التغليف والتعبئة",
"cost_type_shipping_desc": "تكاليف التوصيل والشحن",
"cost_type_confirmation_call_desc": "تكاليف مكالمات تأكيد الطلبات",
"cost_type_custom_desc": "نوع تكلفة مخصص تحدده أنت",
"scope_per_unit_desc": "يُطبق على كل وحدة مباعة",
"scope_global_desc": "تكلفة ثابتة لمرة واحدة",
"cost_type_required": "نوع التكلفة مطلوب",
"amount_required": "المبلغ مطلوب",
"campaign_name_required": "اسم الحملة مطلوب",
"channel_required": "القناة مطلوبة",
"custom_type_name_required": "اسم النوع المخصص مطلوب",
"type_or_select_cost": "اكتب أو اختر نوع التكلفة",
"discard_changes": "تجاهل التغييرات؟",
"discard_changes_desc": "لديك تعديلات غير محفوظة. هل تريد تجاهلها؟",
"discard": "تجاهل",
"keep_editing": "متابعة التعديل",
"save_and_add_another_tooltip": "يحفظ هذه التكلفة ويفتح نموذجاً جديداً بنفس النوع"
```

**English (`en.json`):**
```json
"cost_type_buy_price_desc": "Product purchase cost from supplier",
"cost_type_marketing_desc": "Ad campaign spending",
"cost_type_content_desc": "Content creation and design costs",
"cost_type_packaging_desc": "Packaging and wrapping costs",
"cost_type_shipping_desc": "Delivery and shipping costs",
"cost_type_confirmation_call_desc": "Order confirmation call costs",
"cost_type_custom_desc": "Custom cost type you define",
"scope_per_unit_desc": "Applied to each unit sold",
"scope_global_desc": "One-time fixed cost",
"cost_type_required": "Cost type is required",
"amount_required": "Amount is required",
"campaign_name_required": "Campaign name is required",
"channel_required": "Channel is required",
"custom_type_name_required": "Custom type name is required",
"type_or_select_cost": "Type or select a cost type",
"discard_changes": "Discard changes?",
"discard_changes_desc": "You have unsaved changes. Do you want to discard them?",
"discard": "Discard",
"keep_editing": "Keep editing",
"save_and_add_another_tooltip": "Saves this cost and opens a fresh form with the same type"
```

**French (`fr.json`):**
```json
"cost_type_buy_price_desc": "Coût d'achat du produit chez le fournisseur",
"cost_type_marketing_desc": "Dépenses publicitaires",
"cost_type_content_desc": "Coûts de création de contenu et design",
"cost_type_packaging_desc": "Coûts d'emballage et conditionnement",
"cost_type_shipping_desc": "Coûts de livraison et expédition",
"cost_type_confirmation_call_desc": "Coûts des appels de confirmation",
"cost_type_custom_desc": "Type de coût personnalisé",
"scope_per_unit_desc": "Appliqué à chaque unité vendue",
"scope_global_desc": "Coût fixe unique",
"cost_type_required": "Le type de coût est requis",
"amount_required": "Le montant est requis",
"campaign_name_required": "Le nom de la campagne est requis",
"channel_required": "Le canal est requis",
"custom_type_name_required": "Le nom du type personnalisé est requis",
"type_or_select_cost": "Tapez ou sélectionnez un type de coût",
"discard_changes": "Abandonner les modifications ?",
"discard_changes_desc": "Vous avez des modifications non enregistrées. Voulez-vous les abandonner ?",
"discard": "Abandonner",
"keep_editing": "Continuer l'édition",
"save_and_add_another_tooltip": "Enregistre ce coût et ouvre un nouveau formulaire avec le même type"
```

**Step 3: Commit**

```
feat(product-costs): add i18n keys and description fields for cost form UX overhaul
```

---

## Task 2: Pass optionDefinitions to the cost form dialog

**Files:**
- Modify: `src/sections/product-costs/view/product-costs-view.jsx` (line 170)
- Modify: `src/sections/product-costs/cost-form-dialog.jsx` (props)

**Step 1: Update product-costs-view.jsx**

At line 170, add `optionDefinitions` prop:

```jsx
<CostFormDialog
  open={formDialog.value}
  onClose={formDialog.onFalse}
  productId={id}
  currentCost={editingCost}
  variants={product?.variants || []}
  optionDefinitions={product?.option_definitions || []}
  onSuccess={handleFormSuccess}
/>
```

**Step 2: Update CostFormDialog propTypes**

Add to props destructuring:
```jsx
export default function CostFormDialog({
  open,
  onClose,
  productId,
  currentCost,
  variants,
  optionDefinitions,
  onSuccess,
}) {
```

And propTypes:
```jsx
optionDefinitions: PropTypes.array,
```

**Step 3: Commit**

```
feat(product-costs): pass optionDefinitions to cost form dialog
```

---

## Task 3: Rewrite cost-form-dialog.jsx — Rich Cost Type Autocomplete (Issue 1)

**Files:**
- Modify: `src/sections/product-costs/cost-form-dialog.jsx`

**What to do:**

Replace the `<RHFSelect name="type">` (lines 162-168) with an MUI `Autocomplete` using `Controller` from react-hook-form. Follow the pattern from `option-definition-builder.jsx` lines 402-467.

**Implementation:**

Replace the RHFSelect for type with:

```jsx
<Controller
  name="type"
  control={methods.control}
  render={({ field, fieldState: { error } }) => {
    const selected = COST_TYPES.find((ct) => ct.value === field.value);
    return (
      <Autocomplete
        value={selected || null}
        onChange={(_, newVal) => {
          field.onChange(newVal?.value || '');
        }}
        options={COST_TYPES}
        getOptionLabel={(opt) => t(opt.labelKey)}
        disableClearable
        blurOnSelect
        isOptionEqualToValue={(opt, val) => opt.value === val?.value}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('cost_type')}
            placeholder={t('type_or_select_cost')}
            error={!!error}
            helperText={error?.message}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 0.75,
                        bgcolor: (theme) => alpha(selected?.hexColor || theme.palette.grey[500], 0.12),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify
                        icon={selected?.icon || 'solar:tag-price-bold-duotone'}
                        width={16}
                        sx={{ color: selected?.hexColor || 'text.disabled' }}
                      />
                    </Box>
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, opt) => (
          <li {...props} key={opt.value}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  bgcolor: (theme) => alpha(opt.hexColor, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon={opt.icon} width={20} sx={{ color: opt.hexColor }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600}>
                  {t(opt.labelKey)}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {t(opt.descriptionKey)}
                </Typography>
              </Box>
            </Stack>
          </li>
        )}
      />
    );
  }}
/>
```

**New imports needed at top of file:**
```jsx
import { Controller } from 'react-hook-form';
import { Autocomplete, TextField, InputAdornment, Collapse } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Iconify from 'src/components/iconify';
```

Remove `RHFSelect` from the hook-form import since it's no longer used for the type field (keep it if still used for channel — actually channel will also be replaced in Task 5, so eventually remove it entirely).

**Step 2: Commit**

```
feat(product-costs): replace cost type dropdown with rich autocomplete
```

---

## Task 4: Rich Variant Selector (Issue 3)

**Files:**
- Modify: `src/sections/product-costs/cost-form-dialog.jsx`

**What to do:**

Replace the `<RHFSelect name="variant_id">` (lines 207-216) with an MUI `Autocomplete` that shows variant thumbnail, option values, and price.

**Implementation:**

Add a helper function inside the component (or above the return):

```jsx
const getVariantLabel = (v) => {
  if (!v) return '';
  const optLabels = (v.options || []).map((opt) => {
    const def = optionDefinitions?.find((d) => d.id === opt.option_definition_id);
    const val = def?.values?.find((vl) => vl.id === opt.value_id);
    return val?.value || '';
  }).filter(Boolean);
  return optLabels.length > 0 ? optLabels.join(' / ') : (v.sku || `#${v.id}`);
};
```

Build the options array with a sentinel "all" option:

```jsx
const ALL_VARIANTS_OPTION = { id: 'all', _isAll: true };
const variantOptions = [ALL_VARIANTS_OPTION, ...(variants || [])];
```

Replace the variant selector section:

```jsx
{watchType === 'buy_price' && variants?.length > 0 && (
  <Controller
    name="variant_id"
    control={methods.control}
    render={({ field }) => {
      const selectedVariant = field.value === 'all'
        ? ALL_VARIANTS_OPTION
        : variants?.find((v) => v.id === field.value) || ALL_VARIANTS_OPTION;
      return (
        <Autocomplete
          value={selectedVariant}
          onChange={(_, newVal) => {
            field.onChange(newVal?._isAll ? 'all' : newVal?.id || 'all');
          }}
          options={variantOptions}
          getOptionLabel={(opt) => opt._isAll ? t('all_variants') : getVariantLabel(opt)}
          disableClearable
          isOptionEqualToValue={(opt, val) => {
            if (opt._isAll && val._isAll) return true;
            return opt.id === val?.id;
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('variant')}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    {!selectedVariant?._isAll && selectedVariant?.media?.[0]?.full_url && (
                      <InputAdornment position="start">
                        <Avatar
                          src={selectedVariant.media[0].full_url}
                          variant="rounded"
                          sx={{ width: 28, height: 28 }}
                        />
                      </InputAdornment>
                    )}
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, opt) => (
            <li {...props} key={opt._isAll ? 'all' : opt.id}>
              {opt._isAll ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1,
                      bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Iconify icon="solar:layers-bold-duotone" width={20} sx={{ color: 'info.main' }} />
                  </Box>
                  <Typography variant="body2" fontWeight={600}>{t('all_variants')}</Typography>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                  <Avatar
                    src={opt.media?.[0]?.full_url || ''}
                    variant="rounded"
                    sx={{ width: 36, height: 36, bgcolor: 'background.neutral' }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {getVariantLabel(opt)}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {opt.price ? `${fNumber(opt.price)} ${t('currency_da')}` : ''}
                      {opt.sku ? ` · ${opt.sku}` : ''}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </li>
          )}
        />
      );
    }}
  />
)}
```

**New imports:** Add `Avatar` to the MUI imports. Add `fNumber` from `src/utils/format-number`.

**Step 2: Commit**

```
feat(product-costs): rich variant selector with images and option values
```

---

## Task 5: Animated Conditional Sections (Issue 2) + Rich Channel Selector

**Files:**
- Modify: `src/sections/product-costs/cost-form-dialog.jsx`

**What to do:**

Wrap the marketing-specific and custom-specific fields in `<Collapse>` with a styled sub-section container. Also replace the channel `RHFSelect` with an icon-rich `Autocomplete` using `MARKETING_CHANNELS` data.

**Implementation for marketing section:**

```jsx
<Collapse in={watchType === 'marketing'} unmountOnExit>
  <Stack
    spacing={2}
    sx={{
      p: 2,
      borderRadius: 1.5,
      bgcolor: (theme) => alpha(theme.palette.warning.main, 0.04),
      border: (theme) => `1px dashed ${alpha(theme.palette.warning.main, 0.2)}`,
    }}
  >
    <RHFTextField name="campaign_name" label={t('campaign_name')} inputProps={{ dir: 'auto' }} />

    <Controller
      name="channel"
      control={methods.control}
      render={({ field, fieldState: { error } }) => {
        const selectedChannel = MARKETING_CHANNELS.find((ch) => ch.value === field.value);
        return (
          <Autocomplete
            value={selectedChannel || null}
            onChange={(_, newVal) => field.onChange(newVal?.value || '')}
            options={MARKETING_CHANNELS}
            getOptionLabel={(opt) => t(opt.labelKey)}
            disableClearable
            isOptionEqualToValue={(opt, val) => opt.value === val?.value}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('channel')}
                error={!!error}
                helperText={error?.message}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: selectedChannel ? (
                    <>
                      <InputAdornment position="start">
                        <Iconify icon={selectedChannel.icon} width={20} />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ) : params.InputProps.startAdornment,
                }}
              />
            )}
            renderOption={(props, opt) => (
              <li {...props} key={opt.value}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Iconify icon={opt.icon} width={22} />
                  <Typography variant="body2" fontWeight={500}>{t(opt.labelKey)}</Typography>
                </Stack>
              </li>
            )}
          />
        );
      }}
    />
  </Stack>
</Collapse>

<Collapse in={watchType === 'custom'} unmountOnExit>
  <Stack
    spacing={2}
    sx={{
      p: 2,
      borderRadius: 1.5,
      bgcolor: (theme) => alpha(theme.palette.error.main, 0.04),
      border: (theme) => `1px dashed ${alpha(theme.palette.error.main, 0.2)}`,
    }}
  >
    <RHFTextField name="custom_type_name" label={t('custom_type_name')} inputProps={{ dir: 'auto' }} />
  </Stack>
</Collapse>
```

**Step 2: Remove all `RHFSelect` imports** since type, variant, and channel now all use `Autocomplete`/`Controller`.

**Step 3: Commit**

```
feat(product-costs): animated conditional sections with rich channel selector
```

---

## Task 6: Card-Style Scope Selector (Issue 4)

**Files:**
- Modify: `src/sections/product-costs/cost-form-dialog.jsx`

**What to do:**

Replace the raw `RadioGroup` (lines 187-203) with two styled selectable cards showing icon + label + description.

**Implementation:**

Replace the `<FormControl>...<RadioGroup>...</RadioGroup></FormControl>` block with:

```jsx
<Box>
  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>{t('scope')}</Typography>
  <Stack direction="row" spacing={1.5}>
    {SCOPE_OPTIONS.map((opt) => {
      const isSelected = watch('scope') === opt.value;
      return (
        <Card
          key={opt.value}
          onClick={() => setValue('scope', opt.value)}
          sx={{
            flex: 1,
            p: 2,
            cursor: 'pointer',
            border: (theme) => `1.5px solid ${isSelected ? theme.palette.primary.main : alpha(theme.palette.grey[500], 0.16)}`,
            bgcolor: (theme) => isSelected ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
            transition: 'all 0.15s ease',
            '&:hover': {
              borderColor: (theme) => isSelected ? theme.palette.primary.main : theme.palette.grey[400],
            },
          }}
        >
          <Stack spacing={0.75}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify
                icon={opt.icon}
                width={20}
                sx={{ color: isSelected ? 'primary.main' : 'text.disabled' }}
              />
              <Typography variant="subtitle2" fontWeight={600}>
                {t(opt.labelKey)}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {t(opt.descriptionKey)}
            </Typography>
          </Stack>
        </Card>
      );
    })}
  </Stack>
</Box>
```

**Remove:** `RadioGroup`, `FormControlLabel`, `Radio`, `FormControl`, `FormLabel` from MUI imports (if not used elsewhere in the file).

**Step 2: Commit**

```
feat(product-costs): card-style scope selector with descriptions
```

---

## Task 7: Amount Field Polish (Issue 5)

**Files:**
- Modify: `src/sections/product-costs/cost-form-dialog.jsx`

**What to do:**

Replace the raw `endAdornment: 'DZD'` with a proper `InputAdornment` using `t('currency_da')`. Switch from `type="number"` to `inputMode="decimal"` to remove spinner arrows. Hide native number spinners via sx.

**Implementation:**

Replace the amount field:

```jsx
<RHFTextField
  name="amount"
  label={t('amount')}
  type="number"
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <Typography variant="subtitle2" color="text.secondary">{t('currency_da')}</Typography>
      </InputAdornment>
    ),
  }}
  sx={{
    '& input[type=number]': { MozAppearance: 'textfield' },
    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
  }}
/>
```

**Step 2: Commit**

```
fix(product-costs): proper currency adornment and hide number spinners
```

---

## Task 8: Notes Field Polish (Issue 6)

**Files:**
- Modify: `src/sections/product-costs/cost-form-dialog.jsx`

**What to do:**

Replace `rows={2}` with `minRows={2} maxRows={4}` for auto-expansion. Add `dir="auto"` for mixed-direction input.

**Implementation:**

```jsx
<RHFTextField
  name="notes"
  label={t('notes')}
  multiline
  minRows={2}
  maxRows={4}
  inputProps={{ dir: 'auto', maxLength: 1000 }}
/>
```

**Step 2: Commit**

```
fix(product-costs): expandable notes field with dir auto
```

---

## Task 9: Dialog Actions Refinement (Issue 7)

**Files:**
- Modify: `src/sections/product-costs/cost-form-dialog.jsx`

**What to do:**

Differentiate "Save and Add Another" visually from Cancel. Add tooltip. Disable both buttons during submission.

**Implementation:**

```jsx
<DialogActions>
  <Button variant="outlined" color="inherit" onClick={handleClose} disabled={isSubmitting}>
    {t('cancel')}
  </Button>

  <Box sx={{ flex: 1 }} />

  {!isEdit && (
    <Tooltip title={t('save_and_add_another_tooltip')}>
      <LoadingButton
        variant="soft"
        color="primary"
        loading={isSubmitting}
        onClick={handleSubmit((data) => handleSave(data, true))}
      >
        {t('save_and_add_another')}
      </LoadingButton>
    </Tooltip>
  )}

  <LoadingButton
    variant="contained"
    loading={isSubmitting}
    onClick={handleSubmit((data) => handleSave(data, false))}
  >
    {isEdit ? t('save_changes') : t('add_cost')}
  </LoadingButton>
</DialogActions>
```

Note: `handleClose` is the new dirty-state-aware close handler (see Task 11).

**Step 2: Commit**

```
feat(product-costs): improved dialog action buttons with tooltip
```

---

## Task 10: Proper Error Messages (Issue 8)

**Files:**
- Modify: `src/sections/product-costs/cost-form-dialog.jsx`

**What to do:**

Replace concatenated error messages with dedicated i18n keys. Add `mode: 'onBlur'` to `useForm`.

**Implementation:**

Update useForm:
```jsx
const methods = useForm({
  resolver: yupResolver(CostSchema),
  defaultValues,
  mode: 'onBlur',
});
```

Update Yup schema to use the new dedicated keys:
```jsx
const CostSchema = useMemo(
  () =>
    Yup.object().shape({
      type: Yup.string().required(t('cost_type_required')).oneOf(COST_TYPES.map((ct) => ct.value)),
      scope: Yup.string().required().oneOf(['per_unit', 'global']),
      amount: Yup.number()
        .typeError(t('amount_required'))
        .required(t('amount_required'))
        .min(0)
        .max(99999999.99),
      custom_type_name: Yup.string().when('type', {
        is: 'custom',
        then: (schema) => schema.required(t('custom_type_name_required')),
        otherwise: (schema) => schema.nullable(),
      }),
      campaign_name: Yup.string().when('type', {
        is: 'marketing',
        then: (schema) => schema.required(t('campaign_name_required')),
        otherwise: (schema) => schema.nullable(),
      }),
      channel: Yup.string().when('type', {
        is: 'marketing',
        then: (schema) => schema.required(t('channel_required')).oneOf(MARKETING_CHANNELS.map((ch) => ch.value)),
        otherwise: (schema) => schema.nullable(),
      }),
      variant_id: Yup.mixed()
        .transform((value) => (value === 'all' || value === '' ? null : Number(value)))
        .nullable(),
      notes: Yup.string().max(1000).nullable(),
    }),
  [t]
);
```

**Step 2: Commit**

```
fix(product-costs): proper i18n error messages with onBlur validation
```

---

## Task 11: Dirty State Warning on Close (Issue 12)

**Files:**
- Modify: `src/sections/product-costs/cost-form-dialog.jsx`

**What to do:**

Track `formState.isDirty` and intercept close to show confirmation when form has unsaved changes.

**Implementation:**

Add to destructured formState:
```jsx
const {
  reset,
  watch,
  setValue,
  handleSubmit,
  formState: { isSubmitting, isDirty },
} = methods;
```

Add state and handler:
```jsx
const [confirmClose, setConfirmClose] = useState(false);

const handleClose = () => {
  if (isDirty) {
    setConfirmClose(true);
  } else {
    onClose();
  }
};

const handleConfirmDiscard = () => {
  setConfirmClose(false);
  onClose();
};
```

Change Dialog `onClose` prop to `handleClose`:
```jsx
<Dialog fullWidth maxWidth="sm" open={open} onClose={handleClose}>
```

Add confirmation dialog before closing `</Dialog>`:
```jsx
<Dialog open={confirmClose} maxWidth="xs" onClose={() => setConfirmClose(false)}>
  <DialogTitle>{t('discard_changes')}</DialogTitle>
  <DialogContent>
    <Typography variant="body2" color="text.secondary">
      {t('discard_changes_desc')}
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button variant="outlined" color="inherit" onClick={() => setConfirmClose(false)}>
      {t('keep_editing')}
    </Button>
    <Button variant="contained" color="error" onClick={handleConfirmDiscard}>
      {t('discard')}
    </Button>
  </DialogActions>
</Dialog>
```

**Step 2: Commit**

```
feat(product-costs): dirty state warning on dialog close
```

---

## Task 12: RTL Fixes (Issue 9)

**Files:**
- Modify: `src/sections/product-costs/cost-form-dialog.jsx`

Already handled inline in Tasks 5 and 8 via `inputProps={{ dir: 'auto' }}` on text fields: campaign_name, custom_type_name, notes. No additional step needed.

**Step 1: Verify** all text fields have `dir="auto"` set.

**Step 2: Commit** (can be combined with a prior commit if nothing else changed)

---

## Task 13: Accessibility (Issue 10) + Keyboard Shortcuts (Issue 11)

**Files:**
- Modify: `src/sections/product-costs/cost-form-dialog.jsx`

**Step 1: Add Ctrl+Enter keyboard shortcut**

Add a `useEffect` or `onKeyDown` handler at the form level:

```jsx
const handleKeyDown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    if (e.shiftKey && !isEdit) {
      handleSubmit((data) => handleSave(data, true))();
    } else {
      handleSubmit((data) => handleSave(data, false))();
    }
  }
};
```

Add to `<DialogContent>`:
```jsx
<DialogContent onKeyDown={handleKeyDown}>
```

**Step 2: Disable non-active submit button during submission**

Both `LoadingButton` components already receive `loading={isSubmitting}` which disables them. No further action needed.

**Step 3: Commit**

```
feat(product-costs): keyboard shortcuts for form submission
```

---

## Task 14: Fix hardcoded DA in cost-row.jsx

**Files:**
- Modify: `src/sections/product-costs/cost-row.jsx` (line 87)

**Step 1: Replace hardcoded DA**

```jsx
// Before:
{fNumber(cost.amount)} DA

// After:
{fNumber(cost.amount)} {t('currency_da')}
```

Also improve variant display in the `renderDetails` function (line 65-67):

```jsx
if (variant) {
  const optLabels = (variant.options || []).map((opt) => {
    const def = product?.option_definitions?.find((d) => d.id === opt.option_definition_id);
    const val = def?.values?.find((vl) => vl.id === opt.value_id);
    return val?.value || '';
  }).filter(Boolean);
  parts.push(optLabels.length > 0 ? optLabels.join(' / ') : (variant.sku || `#${variant.id}`));
}
```

**Step 2: Commit**

```
fix(product-costs): translate currency in cost row, improve variant display
```

---

## Task 15: Final Integration Test and Build Verification

**Step 1: Run build**

```bash
npx vite build --logLevel error
```

Expected: Clean build with no errors.

**Step 2: Manual smoke test**

1. Navigate to any product → Costs tab
2. Click "Add Cost"
3. Verify: cost type autocomplete shows icons + descriptions
4. Select "Marketing" → verify animated section appears with channel icons
5. Select "Custom" → verify animated section with custom name field
6. Check variant selector shows images/option values
7. Check scope cards show descriptions
8. Check amount field has proper currency adornment, no spinner
9. Check notes field expands
10. Try Ctrl+Enter to submit
11. Partially fill form → click Cancel → verify discard warning
12. Switch language to Arabic → verify all new strings, RTL layout

**Step 3: Final commit**

```
feat(product-costs): complete cost form dialog UX overhaul

Addresses 12 UX issues:
- Rich cost type autocomplete with icons and descriptions
- Rich variant selector with thumbnails and option values
- Animated conditional sections for marketing/custom fields
- Card-style scope selector with help text
- Proper currency adornment on amount field
- Expandable notes field
- Improved dialog action hierarchy
- Proper i18n error messages with onBlur validation
- RTL text direction support
- Accessibility improvements
- Ctrl+Enter keyboard shortcut
- Dirty state warning on close
```
