import { useState } from 'react';
import PropTypes from 'prop-types';

import {
  TableCell,
  TableRow,
  IconButton,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';

import { fNumber } from 'src/utils/format-number';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import Label from 'src/components/label';

import CostTypeBadge from './cost-type-badge';
import { getChannelConfig } from './constants';

export const COST_TABLE_HEAD = [
  { id: 'type', label: 'cost_type' },
  { id: 'scope', label: 'scope' },
  { id: 'amount', label: 'amount' },
  { id: 'details', label: 'details' },
  { id: 'notes', label: 'notes' },
  { id: 'actions', label: '', width: 50 },
];

export default function CostRow({ cost, product, onEdit, onDelete }) {
  const { t } = useTranslate();
  const popover = usePopover();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(cost.id);
    } finally {
      setDeleting(false);
    }
  };

  const variant = cost.variant_id
    ? product?.variants?.find((v) => v.id === cost.variant_id)
    : null;

  const renderDetails = () => {
    const parts = [];

    if (cost.type === 'marketing') {
      if (cost.campaign_name) parts.push(cost.campaign_name);
      if (cost.channel) {
        const ch = getChannelConfig(cost.channel);
        parts.push(t(ch.labelKey));
      }
    }

    if (cost.type === 'custom' && cost.custom_type_name) {
      parts.push(cost.custom_type_name);
    }

    if (variant) {
      parts.push(variant.name || variant.title || `#${variant.id}`);
    }

    return parts.join(' \u00b7 ') || '\u2014';
  };

  return (
    <>
      <TableRow hover>
        <TableCell>
          <CostTypeBadge type={cost.type} customTypeName={cost.custom_type_name} />
        </TableCell>

        <TableCell>
          <Label variant="soft" color={cost.scope === 'per_unit' ? 'info' : 'warning'}>
            {t(cost.scope === 'per_unit' ? 'scope_per_unit' : 'scope_global')}
          </Label>
        </TableCell>

        <TableCell>
          <Typography variant="body2" fontWeight={600}>
            {fNumber(cost.amount)} DA
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
            {renderDetails()}
          </Typography>
        </TableCell>

        <TableCell>
          {cost.notes ? (
            <Tooltip title={cost.notes}>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 150 }}>
                {cost.notes}
              </Typography>
            </Tooltip>
          ) : (
            '\u2014'
          )}
        </TableCell>

        <TableCell align="right">
          <IconButton onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
      >
        <MenuItem
          onClick={() => {
            popover.onClose();
            onEdit();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          {t('edit')}
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            handleDelete();
          }}
          sx={{ color: 'error.main' }}
          disabled={deleting}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {deleting ? t('deleting', 'Deleting...') : t('delete')}
        </MenuItem>
      </CustomPopover>
    </>
  );
}

CostRow.propTypes = {
  cost: PropTypes.object.isRequired,
  product: PropTypes.object,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
