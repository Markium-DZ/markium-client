import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import { useBoolean } from 'src/hooks/use-boolean';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { STORAGE_API } from 'src/config-global';
import { t } from 'i18next';

// ----------------------------------------------------------------------

export default function OrderTableRow({ row,unit,pv,currentLang, contract, client, selected, onViewRow, onSelectRow, onDeleteRow, onEditRow }) {
  const { status } = row;

  const confirm = useBoolean();

  const collapse = useBoolean();

  const popover = usePopover();
  const yesno = {yes:{ar:"نعم",en:"yes"},no:{ar:"لا",en:"no"}}

  const renderPrimary = (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onClick={onSelectRow} />
      </TableCell>

      {/* <TableCell>{row?.name}</TableCell> */}
      <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
        {/* <Avatar alt={"name"} src={STORAGE_API+"/"+row?.icon} sx={{ mr: 2 }} /> */}
        <ListItemText
          primary={row?.name}
          secondary={row?.note}
          primaryTypographyProps={{ typography: 'body2' }}
          secondaryTypographyProps={{
            component: 'span',
            color: 'text.disabled',
          }}
        />
      </TableCell>

      <TableCell>{unit}</TableCell>
      <TableCell>
      {row?.is_periodic ? yesno.yes[currentLang] : yesno.no[currentLang]}
        {/* <ListItemText
          primary={row?.is_periodic ? "yes" : "no"}
          secondary={row?.is_periodic ? row?.period_value + " " + row?.period_unit : "--"}
          primaryTypographyProps={{ typography: 'body2', noWrap: true }}
          secondaryTypographyProps={{
            mt: 0.5,
            component: 'span',
            typography: 'caption',
          }}
        /> */}
      </TableCell>
      <TableCell>{row?.is_periodic ? row?.period_value + " " + pv : "--"}</TableCell>
      {/* <TableCell>
        <Label
          variant="soft"
          color={
            (row?.is_verified == 1 && 'success') ||
            (row?.is_verified == 0 && 'warning') ||
            'default'
          }
        >
          {row?.is_verified == 1 ? 'true' : "false"}
        </Label>
      </TableCell> */}

      <TableCell align="start" sx={{ px: 1, whiteSpace: 'nowrap' }}>
        {/* <IconButton
          color={collapse.value ? 'inherit' : 'default'}
          onClick={collapse.onToggle}
          sx={{
            ...(collapse.value && {
              bgcolor: 'action.hover',
            }),
          }}
        >
          <Iconify icon="eva:arrow-ios-downward-fill" />
        </IconButton> */}

        <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </TableCell>



      {/*  <TableCell>
        <Label
          variant="soft"
          color={
            (status === 'completed' && 'success') ||
            (status === 'pending' && 'warning') ||
            (status === 'cancelled' && 'error') ||
            'default'
          }
        >
          {status}
        </Label>
      </TableCell> */}

    </TableRow>
  );

  const renderSecondary = (
    <TableRow>
      <TableCell sx={{ p: 0, border: 'none' }} colSpan={8}>
        <Collapse
          in={collapse.value}
          timeout="auto"
          unmountOnExit
          sx={{ bgcolor: 'background.neutral' }}
        >
          <Stack component={Paper} sx={{ m: 1.5 }}>
            {/* {items?.map((item) => (
              <Stack
                key={item.id}
                direction="row"
                alignItems="center"
                sx={{
                  p: (theme) => theme.spacing(1.5, 2, 1.5, 1.5),
                  '&:not(:last-of-type)': {
                    borderBottom: (theme) => `solid 2px ${theme.palette.background.neutral}`,
                  },
                }}
              >
                <Avatar
                  src={item.coverUrl}
                  variant="rounded"
                  sx={{ width: 48, height: 48, mr: 2 }}
                />

                <ListItemText
                  primary={item.name}
                  secondary={item.sku}
                  primaryTypographyProps={{
                    typography: 'body2',
                  }}
                  secondaryTypographyProps={{
                    component: 'span',
                    color: 'text.disabled',
                    mt: 0.5,
                  }}
                />

                <Box>x{item.quantity}</Box>

                <Box sx={{ width: 110, textAlign: 'end' }}>{fCurrency(item.price)}</Box>
              </Stack>
            ))} */}
          </Stack>
        </Collapse>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      {renderPrimary}

      {/* {renderSecondary} */}

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 140 }}
      >

        <MenuItem
          onClick={() => {
            onEditRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          {t("edit")}
        </MenuItem>

        <MenuItem
          onClick={() => {
            confirm.onTrue();
            popover.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t("delete")}
        </MenuItem>


      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}

OrderTableRow.propTypes = {
  row: PropTypes.object,
  selected: PropTypes.bool,
  onViewRow: PropTypes.func,
  onDeleteRow: PropTypes.func,
  onSelectRow: PropTypes.func,
};
