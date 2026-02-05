import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { bgGradient } from 'src/theme/css';

// ----------------------------------------------------------------------

export default function WEcommerceWelcome({ title, description, action, img , direction = "row", ...other }) {
  const theme = useTheme();

  return (
    <Stack
      flexDirection={{ xs: 'column', md: direction }}
      sx={{
        ...bgGradient({
          direction: '135deg',
          startColor: alpha(theme.palette.warning.light, 0.2),
          endColor: alpha(theme.palette.warning.main, 0.2),
        }),
        height: { md: 1 },
        // width:300,
        
        borderRadius: 2,
        position: 'relative',
        color: 'warning.darker',
        backgroundColor: 'common.white',
      }}
      {...other}
    >
      <Stack
        flexGrow={1}
        justifyContent="center"
        alignItems={{ xs: 'center', md: 'flex-start' }}
        sx={{
          p: {
            xs: theme.spacing(5, 3, 0, 3),
            md: theme.spacing(5),
          },
          textAlign: { xs: 'center', md: 'start' },
        }}
      >
        <Typography variant="h4"  sx={{ mb: 2, whiteSpace: 'pre-line' }}>
          {title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            opacity: 0.8,
            maxWidth: 360,
            mb: { xs: 3, xl: 5 },
          }}
        >
          {description}
        </Typography>

        {action && action}
      </Stack>

      {img && (
        <Stack
          component="span"
          justifyContent="center"
          sx={{
            p: { xs: 5, md: 3 },
            maxWidth: 360,
            mx: 'auto',
          }}
        >
          {img}
        </Stack>
      )}
    </Stack>
  );
}

WEcommerceWelcome.propTypes = {
  action: PropTypes.node,
  description: PropTypes.string,
  img: PropTypes.node,
  title: PropTypes.string,
};
