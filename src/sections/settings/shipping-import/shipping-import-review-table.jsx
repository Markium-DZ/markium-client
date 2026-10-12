import PropTypes from 'prop-types';

import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import TableContainer from '@mui/material/TableContainer';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useTranslate } from 'src/locales';

import { STATUS } from './review-model';

// ----------------------------------------------------------------------

const STATUS_COLOR = {
  [STATUS.FOUND]: 'success',
  [STATUS.CHECK]: 'warning',
  [STATUS.MISSING]: 'default',
};

function localName(item, lang) {
  if (!item) return '';
  if (lang.startsWith('ar')) return item.name_ar || item.name || item.name_en || '';
  if (lang.startsWith('en')) return item.name_en || item.name || item.name_ar || '';
  return item.name || item.name_en || item.name_ar || '';
}

// ----------------------------------------------------------------------

export default function ShippingImportReviewTable({ rows, onChange }) {
  const { t, i18n } = useTranslate();
  const lang = i18n?.language || 'ar';

  const renderCurrent = (current) => {
    if (!current) return '—';
    if (current.varies) return t('shipping_import_varies');
    return `${current.home} / ${current.desk}`;
  };

  const renderStatus = (row) => {
    if (row.status === STATUS.CONFLICT) {
      return (
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          value={row.choice}
          onChange={(event, choice) => {
            if (choice) onChange(row.wilaya.id, { choice });
          }}
        >
          <ToggleButton value="current" sx={{ whiteSpace: 'nowrap' }}>
            {t('shipping_import_keep_current')}
          </ToggleButton>
          <ToggleButton value="imported" sx={{ whiteSpace: 'nowrap' }}>
            {t('shipping_import_use_imported')}
          </ToggleButton>
        </ToggleButtonGroup>
      );
    }

    return (
      <Tooltip title={row.note ? String(row.note) : ''}>
        <Chip
          size="small"
          variant="soft"
          color={STATUS_COLOR[row.status] || 'default'}
          label={t(`shipping_import_status_${row.status}`)}
        />
      </Tooltip>
    );
  };

  const renderPrice = (row, field) => (
    <TextField
      size="small"
      type="number"
      value={row[field]}
      onChange={(event) =>
        onChange(row.wilaya.id, { [field]: event.target.value, choice: 'imported' })
      }
      inputProps={{ min: 0, step: 10 }}
      sx={{ width: 90 }}
    />
  );

  return (
    <TableContainer sx={{ maxHeight: '60vh' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('shipping_import_col_wilaya')}</TableCell>
            <TableCell>{t('shipping_prices_home')}</TableCell>
            <TableCell>{t('shipping_prices_desk')}</TableCell>
            <TableCell>{t('shipping_import_col_current')}</TableCell>
            <TableCell>{t('shipping_import_col_status')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.wilaya.id} hover>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                {String(row.wilaya.code ?? row.wilaya.id).padStart(2, '0')} -{' '}
                {localName(row.wilaya, lang)}
              </TableCell>
              <TableCell>{renderPrice(row, 'home')}</TableCell>
              <TableCell>{renderPrice(row, 'desk')}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{renderCurrent(row.current)}</TableCell>
              <TableCell>{renderStatus(row)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

ShippingImportReviewTable.propTypes = {
  rows: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
};
