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
import { useTranslate } from 'src/locales';
import { Grid, Link } from '@mui/material';
import { paths } from 'src/routes/paths';
import ExpandableText from '../maintain/ExpandableText';
import PermissionsContext from 'src/auth/context/permissions/permissions-context';

// ----------------------------------------------------------------------

export default function OrderTableRow({
  row,
  contract,
  selected,
  companies,
  onViewRow,
  onSelectRow,
  onDeleteRow,
  onEditRow,
  onDriverViewRow,
  onContractViewRow,
  onCompanyViewRow,
  onAddCarToMentainance,
  onMarkCarAsAvailable,
}) {
  const {
    color,
    car_model_id,
    status,
    model,
    production_year,
    plat_number,
    totalQuantity,
    subTotal,
  } = row;

  const confirm = useBoolean();

  const { t } = useTranslate();

  const collapse = useBoolean();

  const popover = usePopover();

  const company = companies?.find(c => c.id == contract?.company_id)
  console.log("company , ", company);

  const statusString = status?.translations?.[0]?.name;

  const renderPrimary = (
    <TableRow hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onClick={onSelectRow} />
      </TableCell>
      {/* <TableCell>
        <Box
          onClick={onViewRow}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          {model?.company?.translations?.name}
        </Box>
      </TableCell> */}

      {/* <TableCell>{model?.id}</TableCell> */}
      {/* <TableCell>{model?.translations?.name}</TableCell> */}
      <TableCell>
        <Box
          onClick={onViewRow}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          {plat_number}
        </Box>
      </TableCell>
      <TableCell>
        <Box
          onClick={onViewRow}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          <ListItemText
            primary={model?.translations?.name}
            secondary={model?.company?.translations?.name}
            primaryTypographyProps={{ typography: 'body2', noWrap: true }}
            secondaryTypographyProps={{
              mt: 0.5,
              component: 'span',
              typography: 'caption',
            }}
          />
        </Box>
      </TableCell>



      <TableCell align='center'>
        <ListItemText
          primary={fDate(production_year, 'yyyy')}
          primaryTypographyProps={{ typography: 'body2', noWrap: true }}
          secondaryTypographyProps={{
            mt: 0.5,
            component: 'span',
            typography: 'caption',
          }}
        />
      </TableCell>
      {/* <TableCell> {color?.translations?.name} </TableCell> */}

      <TableCell direction="column" >
        {/* <Grid container spacing={1} > */}
          {
            row?.status?.key == "rented" ?
              <Label color={"warning"} sx={{ cursor: 'pointer', marginStart: "10px" }}>
                {status?.translations?.name}
              </Label>
              :
              contract?.ref && status != "rented" ?
                <Label color={"warning"} sx={{ cursor: 'pointer', marginStart: "10px" }}>
                  {status?.translations?.name + " / " + t("rented")}
                </Label>
                :
                <Label
                  variant="soft"
                  color={
                    (status?.key === 'available' && 'success') ||
                    (status?.key === 'rented' && 'warning') ||
                    (status?.key === 'under_maintenance' && 'error') ||
                    (status?.key === 'under_preparation' && 'secondary') ||
                    'default'
                  }
                >
                  {status?.translations?.name}
                </Label>
          }
        {/* </Grid> */}
      </TableCell>
      {/*  */}
      <TableCell >
        {
          row?.driver?.id ?
            <Box
              onClick={onDriverViewRow}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {row?.driver?.name}
            </Box>
            :
            "-"
        }
      </TableCell>
      <TableCell align="start" >
        {
          row?.is_rented ?

            <Box
              display={"flex"}
              flexDirection={"row"}
              onClick={() => onCompanyViewRow(company?.id)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              <ExpandableText text={company?.name} length={3} />
            </Box>
            :
            "--"
        }
      </TableCell>
      <TableCell align="start" >
        {
          row?.is_rented ?
            <Box
              onClick={() => onContractViewRow(contract?.id)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {contract?.ref}
            </Box>
            :
            "--"
        }
      </TableCell>

      {/* <TableCell align="center" >
        <>

          <Box
            onClick={() => onContractViewRow(contract?.id)}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {
              contract?.ref ?
                <Label color={"warning"} sx={{ cursor: 'pointer' }}>
                  {contract?.ref}
                </Label>
                :
                "-"}
          </Box>
        </>
      </TableCell> */}

      <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
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
            {/* {items.map((item) => (
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

      {renderSecondary}

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 200 }}
      >
        <PermissionsContext action={'delete.car'}>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('delete')}
          </MenuItem>
        </PermissionsContext>
        <PermissionsContext action={'update.car'}>
          <MenuItem
            onClick={() => {
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('edit')}
          </MenuItem>
        </PermissionsContext>

        <MenuItem
          onClick={() => {
            onViewRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:eye-bold" />
          {t('view')}
        </MenuItem>

        <MenuItem
          onClick={() => {
            onAddCarToMentainance();
            popover.onClose();
          }}
        >
          <Iconify icon="map:car-repair" />
          {t('addToMaintenance')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            onMarkCarAsAvailable();
            popover.onClose();
          }}
          disabled={status?.key !== 'under_preparation'}
        >
          <Iconify icon="solar:clipboard-check-bold-duotone" />
          {t('markAsAvailable')}
        </MenuItem>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title={t('delete')}
        content={t('deleteConfirm')}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDeleteRow();
              confirm.onFalse();
            }}
          >
            {t('delete')}
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
