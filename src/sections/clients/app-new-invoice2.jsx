import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { fCurrency } from 'src/utils/format-number';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useGetCar } from 'src/api/car';
import { useGetDrivers } from 'src/api/drivers';
import { ListItemText } from '@mui/material';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { useGetClaim } from 'src/api/claim';
import { useEffect, useState } from 'react';
import { fDate } from 'src/utils/format-time';
import { t } from 'i18next';
import ContentDialog from 'src/components/custom-dialog/content-dialog';
import { CloseClaim } from './ContractClaimsTable/CloseClaim';
import { useBoolean } from 'src/hooks/use-boolean';
import { EditClaim } from './ContractClaimsTable/EditClaim';

// ----------------------------------------------------------------------

export default function AppNewInvoice2({ title, subheader, tableData, contract_id, setTableData, tableLabels, ...other }) {
  // const { claims } = useGetClaim();

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{}}>
            <TableHeadCustom headLabel={tableLabels} />

            <TableBody>
              {tableData?.map((row) => (
                <AppNewInvoiceRow key={row.id} setTableData={setTableData} contract_id={contract_id} row={row} />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box sx={{ p: 2, textAlign: 'end' }}>
        <Button
          size="small"
          color="inherit"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
        >
          {t("view_all")}
        </Button>
      </Box>
    </Card>
  );
}

AppNewInvoice2.propTypes = {
  subheader: PropTypes.string,
  claims: PropTypes.array,
  tableLabels: PropTypes.array,
  title: PropTypes.string,
};

// ----------------------------------------------------------------------

function AppNewInvoiceRow({ row, clausable, contract_id, setTableData }) {
  const popover = usePopover();
  const router = useRouter();

  const completed = useBoolean();
  const edit = useBoolean();

  const handleDownload = () => {
    popover.onClose();
    console.info('DOWNLOAD', row.id);
  };

  const handlePrint = () => {
    popover.onClose();
    console.info('PRINT', row.id);
  };

  const handleShare = () => {
    popover.onClose();
    console.info('SHARE', row.id);
  };

  const handleDelete = () => {
    popover.onClose();
    console.info('DELETE', row.id);
  };
  const handleViewClausable = () => {
    console.log(row);
    if (row?.clauseable_type == "car") {
      router.push(paths.dashboard.vehicle.details(row?.clauseable_id));
    } else {
      router.push(paths.dashboard.drivers.details(row?.clauseable_id));
    }
    console.info('DELETE', row.id);
  };

  return (
    <>
      <TableRow>
        <TableCell>
          {row?.amount}
        </TableCell>

        <TableCell>{fDate(row?.created_at)}</TableCell>

        <TableCell>{fDate(row?.paiment_date)}</TableCell>

        <TableCell>
          {row?.status?.translations[0]?.name}
        </TableCell>

        <TableCell align="right" sx={{ pr: 1 }}>
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 160 }}
      >
        {
          row?.status?.key !== "paid_claim" ?
            <MenuItem onClick={() => { completed.onTrue();popover.onClose(); }}>
              <Iconify icon="duo-icons:folder-open" />
              {t("close_claim")}
            </MenuItem>
            :
            null
        }
        <MenuItem onClick={() => { edit.onTrue();popover.onClose(); }}>
          <Iconify icon="solar:pen-bold" />
          {t("edit")}
        </MenuItem>

      </CustomPopover>
      <ContentDialog
        open={completed.value}
        onClose={completed.onFalse}
        title={t("")}
        content={
          <CloseClaim claim_id={row?.id} contract_id={contract_id} setTableData={setTableData} close={() => { completed?.onFalse(); popover.onClose }} />
        }
      />
      <ContentDialog
        open={edit.value}
        onClose={edit.onFalse}
        title={t("")}
        content={
          <EditClaim claim_id={row?.id} paiment_date={row?.paiment_date} amount={row?.amount} contract_id={contract_id} setTableData={setTableData} close={() => { edit?.onFalse(); popover.onClose }} />
        }
      />
    </>
  );
}

AppNewInvoiceRow.propTypes = {
  row: PropTypes.object,
};
