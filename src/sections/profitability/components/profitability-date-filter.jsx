import PropTypes from 'prop-types';
import { MenuItem, TextField } from '@mui/material';
import { useTranslate } from 'src/locales';
import { DATE_RANGE_OPTIONS } from '../constants';

// ----------------------------------------------------------------------

export default function ProfitabilityDateFilter({ value, onChange, sx }) {
  const { t } = useTranslate();

  return (
    <TextField
      select
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ minWidth: 160, ...sx }}
    >
      {DATE_RANGE_OPTIONS.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>
          {t(opt.labelKey)}
        </MenuItem>
      ))}
    </TextField>
  );
}

ProfitabilityDateFilter.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  sx: PropTypes.object,
};
