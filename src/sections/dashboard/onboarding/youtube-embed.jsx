import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const DEFAULT_VIDEO_ID = 'tpOTvEBquHM';

// ----------------------------------------------------------------------

export default function YouTubeEmbed({ videoId = DEFAULT_VIDEO_ID, sx, ...other }) {
  const { t } = useTranslation();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', ...sx }} {...other}>
      <CardHeader
        title={t('learn_more')}
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
        avatar={<Iconify icon="solar:play-circle-bold" width={22} sx={{ color: 'error.main' }} />}
        sx={{ px: 2.5, pt: 2, pb: 1 }}
      />

      <Box sx={{ flexGrow: 1, position: 'relative', minHeight: 0, px: 2, pb: 2 }}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: 1.5,
            overflow: 'hidden',
          }}
        >
          <iframe
            title={t('learn_more')}
            style={{ width: '100%', height: '100%', border: 0 }}
            src={`https://www.youtube.com/embed/${videoId}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </Box>
      </Box>
    </Card>
  );
}

YouTubeEmbed.propTypes = {
  videoId: PropTypes.string,
  sx: PropTypes.object,
};
