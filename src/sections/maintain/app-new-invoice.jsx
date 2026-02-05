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
import { ListItemText } from '@mui/material';
import { toNumber } from 'lodash';
import { useValues } from 'src/api/utils';
import UserNewEditForm from 'src/sections/clause/user-new-edit-form';
import { t } from 'i18next';
import { useLocales } from 'src/locales';


// ----------------------------------------------------------------------

export default function AppNewInvoice({ title, maintenance_id, subheader, tableData, setTableData, tableLabels, ...other }) {
  const { data } = useValues()

  const p_n = { periodic: { en: "periodic", ar: "دوري" }, not_periodic: { en: "not_periodic", ar: "غير دوري" } }
  const { currentLang } = useLocales()
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 680 }}>
            <TableHeadCustom headLabel={tableLabels} />

            <TableBody>
              {tableData.map((row) => (
                <AppNewInvoiceRow
                  p_n={!!row?.is_periodic ? p_n?.periodic[currentLang?.value] : p_n?.not_periodic[currentLang?.value]}
                  piece_status={data?.piece_status_enum?.find(item => item.key == row?.piece_status)?.translations[0]?.name}
                  volume={data?.volume_enum?.find(item => item.key == row?.unit)?.translations[0]?.name}
                  maintenance_spec={data?.maintenance_specifications?.find(item => item.id == row?.related_id)?.name}
                  key={row.id}
                  row={row} />
              ))}
            </TableBody>
          </Table>
          <UserNewEditForm maintenance_id={maintenance_id} setTableData={setTableData} />
        </Scrollbar>
      </TableContainer>
      {/* <Divider sx={{ borderStyle: 'dashed' }} /> */}
      {/* <Box sx={{ p: 2, textAlign: 'end' }}>
        <Button
          size="small"
          color="inherit"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
        >
          {t("view_all")}
        </Button>
      </Box> */}
    </Card>
  );
}

AppNewInvoice.propTypes = {
  subheader: PropTypes.string,
  tableData: PropTypes.array,
  tableLabels: PropTypes.array,
  title: PropTypes.string,
};

// ----------------------------------------------------------------------

function AppNewInvoiceRow({ row, maintenance_spec, p_n,piece_status,volume }) {
  const popover = usePopover();

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

  return (
    <>
      <TableRow>
        <TableCell>{p_n}</TableCell>
        <TableCell>{maintenance_spec}</TableCell>
        <TableCell>{row?.cost}</TableCell>
        <TableCell>{row?.quantity + " " + volume}</TableCell>
        <TableCell>{piece_status}</TableCell>
        <TableCell align="left">{toNumber(row?.cost) * row?.quantity + ".00 "}</TableCell>
        <TableCell>{row?.note || "--"}</TableCell>
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
        <Divider sx={{ borderStyle: 'dashed' }} />
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t("delete")}
        </MenuItem>
      </CustomPopover>
    </>
  );
}

AppNewInvoiceRow.propTypes = {
  row: PropTypes.object,
  maintenance_spec: PropTypes.string,
};
