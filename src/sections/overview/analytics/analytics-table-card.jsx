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
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import Tooltip from '@mui/material/Tooltip';
import Iconify from 'src/components/iconify';
import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export default function AnalyticsTableCard({ title, subheader, columns, rows, maxRows = 10, ...other }) {
  const theme = useTheme();
  const { t } = useTranslate();

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
                  <TableCell key={col.key} align={col.align || 'left'} sx={col.truncate ? { maxWidth: col.truncate, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : undefined}>
                    {col.truncate ? (
                      <Tooltip title={row[col.key]} arrow placement="top">
                        <span>{col.format ? col.format(row[col.key]) : row[col.key]}</span>
                      </Tooltip>
                    ) : (
                      col.format ? col.format(row[col.key]) : row[col.key]
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Stack alignItems="center" spacing={0.5} sx={{ py: 4 }}>
                    <Box sx={{ p: 1, borderRadius: '50%', bgcolor: alpha(theme.palette.grey[500], 0.08) }}>
                      <Iconify icon="solar:document-text-bold-duotone" width={24} sx={{ color: 'text.disabled' }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('no_data')}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {t('analytics_no_data_hint')}
                    </Typography>
                  </Stack>
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
      truncate: PropTypes.number,
    })
  ).isRequired,
  rows: PropTypes.array.isRequired,
  maxRows: PropTypes.number,
};
