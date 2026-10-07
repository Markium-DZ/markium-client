import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { varFade } from '../animate';
import FileThumbnail, { fileData } from '../file-thumbnail';
import { fileFormat } from '../file-thumbnail/utils';
import { t } from 'i18next';
import { Link } from '@mui/material';

// ----------------------------------------------------------------------

const formatLabel = (format) => {
  switch (format) {
    case 'image':
      return t("image");
    case 'pdf':
      return t("pdf");
    case 'word':
      return t("word");
    case 'excel':
      return t("excel");
    default:
      return t("file");
  }
};

export default function MultiFilePreview({ thumbnail, files, sx,onClose }) {
  return (
    <AnimatePresence initial={false}>
      {files?.map((file) => {
        console.log("file : file : ",file)
        const { key, path = '', preview = '' } = fileData(file);
        const format = fileFormat(path || preview);
        const label = formatLabel(format);

        if (thumbnail) {
          // Thumbnail / grid mode
          return (
            <Stack
              key={key}
              component={m.div}
              {...varFade().inUp}
              alignItems="center"
              display="inline-flex"
              justifyContent="center"
              sx={{
                m: 0.5,
                width: 80,
                height: 80,
                borderRadius: 1.25,
                overflow: 'hidden',
                position: 'relative',
                border: (theme) => `solid 1px ${alpha(theme.palette.grey[500], 0.16)}`,
                ...sx,
              }}
            >
              <FileThumbnail
                tooltip
                imageView
                file={file}
                sx={{ position: 'absolute' }}
                imgSx={{ position: 'absolute' }}
              />
              {/* Overlay label */}
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  left: 2,
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  px: 0.5,
                  borderRadius: 0.5,
                  fontSize: 10,
                }}
              >
                {label}
              </Typography>
            </Stack>
          );
        }

        // List mode
        return (
          <Link href={`/${file?.path}`} target='_blank'>
            <Stack
              key={key}
              component={m.div}
              {...varFade().inUp}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                my: 1,
                py: 1,
                px: 1.5,
                borderRadius: 1,
                border: (theme) => `solid 1px ${alpha(theme.palette.grey[500], 0.16)}`,
                ...sx,
              }}
            >
              <FileThumbnail file={file} />
              <Typography variant="body2" >{label}</Typography>
            </Stack>
          </Link>
        );
      })}
    </AnimatePresence>
  );
}

MultiFilePreview.propTypes = {
  files: PropTypes.array,
  sx: PropTypes.object,
  thumbnail: PropTypes.bool,
};
