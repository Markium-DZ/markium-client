import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';
import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown';

// ----------------------------------------------------------------------

export default function ProductDetailsDescription({ description, editLink }) {
  const { t } = useTranslate();

  if (!description) {
    return (
      <Box
        sx={{
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'text.disabled',
          gap: 1.5,
        }}
      >
        <Iconify icon="solar:document-text-bold-duotone" width={48} />
        <Typography variant="subtitle2">{t('no_description_yet')}</Typography>
        {editLink && (
          <Button
            component={RouterLink}
            href={editLink}
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:pen-bold" width={16} />}
          >
            {t('add_description')}
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Markdown
      children={description}
      sx={{
        p: 3,
        '& p, li, ol': {
          typography: 'body2',
        },
        '& ol': {
          p: 0,
          display: { md: 'flex' },
          listStyleType: 'none',
          '& li': {
            '&:first-of-type': {
              minWidth: 240,
              mb: { xs: 0.5, md: 0 },
            },
          },
        },
      }}
    />
  );
}

ProductDetailsDescription.propTypes = {
  description: PropTypes.string,
  editLink: PropTypes.string,
};
