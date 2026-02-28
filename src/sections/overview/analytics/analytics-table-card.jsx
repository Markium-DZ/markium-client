import PropTypes from 'prop-types';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';

// ----------------------------------------------------------------------

export default function AnalyticsTableCard({ title, subheader, columns, rows, maxRows = 10, ...other }) {
  return (
    <Card {...other}>
      {title && <CardHeader title={title} subheader={subheader} />}
      <TableContainer sx={{ px: 2, pb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align || 'left'}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(0, maxRows).map((row, index) => (
              <TableRow key={index}>
                {columns.map((col) => (
                  <TableCell key={col.key} align={col.align || 'left'}>
                    {col.format ? col.format(row[col.key]) : row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Box sx={{ py: 3, color: 'text.secondary' }}>No data</Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

AnalyticsTableCard.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      align: PropTypes.string,
      format: PropTypes.func,
    })
  ).isRequired,
  rows: PropTypes.array.isRequired,
  maxRows: PropTypes.number,
};
