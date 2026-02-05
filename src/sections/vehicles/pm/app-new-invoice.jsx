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
import { fDate } from 'src/utils/format-time';
import { ListItemText } from '@mui/material';
import { useValues } from 'src/api/utils';

// ----------------------------------------------------------------------

export default function AppNewInvoice({ title, subheader, tableData, tableLabels, ...other }) {
  const {data} = useValues();
  
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 550 }}>
            <TableHeadCustom headLabel={tableLabels} />

            <TableBody>
              {tableData.map((row) => (
                <AppNewInvoiceRow key={row.id} unit={data?.unit_enum?.find(item => item.key == row?.period_unit)?.translations[0]?.name} row={row} maintenance={data?.maintenance_specifications?.find(item=>item?.id=="d")}  />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <Divider sx={{ borderStyle: 'dashed' }} />

      {/* <Box sx={{ p: 2, textAlign: 'end' }}>
        <Button
          size="small"
          color="inherit"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
        >
          View All
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

function AppNewInvoiceRow({ row ,spec,unit}) {
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
        {/* <TableCell>{row.id}</TableCell> */}
        <TableCell>{row?.name}</TableCell>
        {/* <TableCell>{fDate(row.created_at)}</TableCell> */}
        {/* <TableCell>
          <ListItemText
            primary={fDate(row?.entry_date)}
            secondary={fDate(row?.exit_date)}
            primaryTypographyProps={{ typography: 'body2', noWrap: true }}
            secondaryTypographyProps={{
              mt: 0.5,
              component: 'span',
              typography: 'caption',
            }}
          />
        </TableCell> */}
        <TableCell>{row?.period_value + " " + unit}</TableCell>
        <TableCell>
          <ListItemText
            primary={row?.last_value}
            secondary={row?.status_description}
              // Math.round(row?.remaining *row?.period_value) >= 0 ?
              // "remaining: "+Math.round(row?.remaining *row?.period_value)+" "+ row?.unit
              // :
              // "overreach: "+Math.round(row?.remaining *row?.period_value) * -1+" "+ row?.unit
            primaryTypographyProps={{ typography: 'body2', noWrap: true }}
            secondaryTypographyProps={{
              mt: 0.5,
              component: 'span',
              typography: 'caption',
            }}
          />
        </TableCell>
        <TableCell>{row?.status?.translations[0].name}</TableCell>
        {/* <TableCell align="right" sx={{ pr: 1 }}>
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell> */}
      </TableRow>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 160 }}
      >
        <MenuItem onClick={handleDownload}>
          <Iconify icon="eva:cloud-download-fill" />
          Download
        </MenuItem>

        <MenuItem onClick={handlePrint}>
          <Iconify icon="solar:printer-minimalistic-bold" />
          Print
        </MenuItem>

        <MenuItem onClick={handleShare}>
          <Iconify icon="solar:share-bold" />
          Share
        </MenuItem>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </CustomPopover>
    </>
  );
}

AppNewInvoiceRow.propTypes = {
  row: PropTypes.object,
};
