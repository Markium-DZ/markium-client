import PropTypes from 'prop-types';
import { differenceInDays } from 'date-fns';

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
import { useLocales, useTranslate } from 'src/locales';
import { Card, Link } from '@mui/material';

import * as Yup from 'yup';
import { useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';


import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFUpload,

} from 'src/components/hook-form';

import RHFFileInput from 'src/components/hook-form/rhf-input-field';
import FileThumbnail from 'src/components/file-thumbnail';
import ContentDialog from 'src/components/custom-dialog/content-dialog';
import { markMaintenanceAsCompeleted, releaseCar } from 'src/api/maintainance';


// ----------------------------------------------------------------------

export default function OrderTableRow({
  row,
  car_model,
  work_site,
  driver,
  selected,
  onViewRow,
  onSelectRow,
  onMarkAsCompleted,
  onDeleteRow,
  onEditRow,
  onViewMaintenance,
}) {
  const {
    exit_date,
    status,
    maintenance_manager,
    remaining_days,
    // car_model,
    cause,
    driver_phone_number,
    plat_number,
    car,
    state,
    occupant_name,
    type,
  } = row;

  const confirm = useBoolean();
  const completed = useBoolean();

  const collapse = useBoolean();

  const day = { ar: "يوم", en: 'day' }
  const days = { ar: "ايام", en: 'day' }
  const { currentLang } = useLocales()

  console.log("currecnt lang : ",currentLang);

  const popover = usePopover();

  const { t } = useTranslate();

  const renderPrimary = (
    <TableRow hover selected={selected}>
      <TableCell>
      <Box
          onClick={()=>onViewMaintenance()}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
        {row?.id}
        </Box>
      </TableCell>
      <TableCell>
        <Link href={"/dashboard/vehicle/" + car?.id}>
          <ListItemText
            onClick={onViewRow}
            sx={{
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
            primary={car_model}
            secondary={car?.plat_number}
          />
        </Link>
      </TableCell>
      {/* <TableCell>{car_model}</TableCell> */}
      <TableCell>{state?.translations[0]?.name}</TableCell>
      <TableCell>{remaining_days} {remaining_days ? remaining_days >2 && remaining_days < 11 ?days[currentLang?.value] :day[currentLang?.value]   : "-"}</TableCell>
      {/* <TableCell>{occupant_name}</TableCell> */}

      <TableCell>
        <Label
          variant="soft"
          color={
            (status?.key === 'completed' && 'success') ||
            (status?.key === 'pending' && 'warning') ||
            (status?.key === 'cancelled' && 'error') ||
            'default'
          }
        >
          {/* {status?.translations[0]?.name} */}
          {status?.translations[0]?.name}
        </Label>
      </TableCell>
      {/* <TableCell> {driver_phone_number || '-'} </TableCell> */}
      <TableCell>
        <ListItemText
          primary={driver?.name || "--"}
          secondary={driver?.phone}
          primaryTypographyProps={{ typography: 'body2', noWrap: true }}
          secondaryTypographyProps={{
            mt: 0.5,
            component: 'span',
            typography: 'caption',
          }}
        />
      </TableCell>

      <TableCell align="center" sx={{ px: 1, whiteSpace: 'nowrap' }}>

        <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </TableCell>
    </TableRow>
  );

  // const renderSecondary = (
  //   <TableRow>
  //     <TableCell sx={{ p: 0, border: 'none' }} colSpan={8}>
  //       <Collapse
  //         in={collapse.value}
  //         timeout="auto"
  //         unmountOnExit
  //         sx={{ bgcolor: 'background.neutral' }}
  //       >
  //         <Stack component={Paper} sx={{ m: 1.5 }}>
  //           {items.map((item) => (
  //             <Stack
  //               key={item.id}
  //               direction="row"
  //               alignItems="center"
  //               sx={{
  //                 p: (theme) => theme.spacing(1.5, 2, 1.5, 1.5),
  //                 '&:not(:last-of-type)': {
  //                   borderBottom: (theme) => `solid 2px ${theme.palette.background.neutral}`,
  //                 },
  //               }}
  //             >
  //               <Avatar
  //                 src={item.coverUrl}
  //                 variant="rounded"
  //                 sx={{ width: 48, height: 48, mr: 2 }}
  //               />

  //               <ListItemText
  //                 primary={item.name}
  //                 secondary={item.sku}
  //                 primaryTypographyProps={{
  //                   typography: 'body2',
  //                 }}
  //                 secondaryTypographyProps={{
  //                   component: 'span',
  //                   color: 'text.disabled',
  //                   mt: 0.5,
  //                 }}
  //               />

  //               <Box>x{item.quantity}</Box>

  //               <Box sx={{ width: 110, textAlign: 'end' }}>{fCurrency(item.price)}</Box>
  //             </Stack>
  //           ))}
  //         </Stack>
  //       </Collapse>
  //     </TableCell>
  //   </TableRow>
  // );

  return (
    <>
      {renderPrimary}

      {/* {renderSecondary} */}

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 190 }}
      >
        <MenuItem
          onClick={() => {
            onViewRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:eye-bold" />
          {t("overview")}
        </MenuItem>

        <MenuItem
          onClick={() => {
            onEditRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          {t("edit")}
        </MenuItem>

        {status?.key === 'pending' ?
        <MenuItem
          onClick={() => {
            completed.onTrue();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          {t("mark_as_completed")}
        </MenuItem> 
        : 
        null }

        {/* <MenuItem
          onClick={() => {
            confirm.onTrue();
            popover.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem> */}
      </CustomPopover>

      <ContentDialog
        open={completed.value}
        onClose={completed.onFalse}
        title="Complete"
        content={
          <MarkAsCompletedForm maintenanceId={row?.id} close={() => completed?.onFalse()} />
        }
      />
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDeleteRow();
              confirm.onFalse();
            }}
          >
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


export function MarkAsCompletedForm({ maintenanceId, close }) {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslate();

  const NewUserSchema = Yup.object().shape({
    invoice: Yup.mixed().nullable()
  });

  const defaultValues = useMemo(
    () => ({
      invoice : ''
    }),
    []
  );

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    setValue,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    console.log("hi there 1");
    try {
      console.log("hi there 2");
      const formData = new FormData();
  
      if (Array.isArray(data.invoice)) {
        data.invoice.forEach((file) => {
          formData.append("invoice[]", file);
        });
      } else {
        formData.append("invoice[]", data.invoice);
      }
      
  
      console.log("hi there 3 formData", formData.getAll("invoice[]")); // Debugging
  
      const response = await markMaintenanceAsCompeleted(maintenanceId,formData);
      console.log("hi there 4");
  
      enqueueSnackbar(t("operation_success"), { variant: 'success' });
      close();
    } catch (error) {
      console.error(error);
      Object.values(error?.data || {}).forEach(array => {
        array.forEach(text => {
          enqueueSnackbar(text, { variant: 'error' });
        });
      });
      if(error?.message){
        enqueueSnackbar(error?.message, { variant: 'error' });
      }
    }
  });
  
  
  


  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={12}>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(1, 1fr)',
            }}
          >
            <RHFUpload multiple name="invoice" lable={"Upload Invoice File"} />

          </Box>
          <Stack alignItems="flex-end" sx={{ mt: 3 }}>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              {t("submit")}
            </LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </FormProvider>
  )
}