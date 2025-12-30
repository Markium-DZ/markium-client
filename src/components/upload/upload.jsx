import PropTypes from 'prop-types';
import { useDropzone } from 'react-dropzone';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Iconify from '../iconify';
import MultiFilePreview from './preview-multi-file';
import SingleFilePreview from './preview-single-file';
import RejectionFiles from './errors-rejection-files';
import { useState, useEffect } from 'react';
import { t } from 'i18next';
import { FormHelperText } from '@mui/material';
import { STORAGE_API } from 'src/config-global';

export default function Upload({
  disabled,
  placeholder,
  multiple = false,
  error,
  name,
  helperText,
  label,
  file,
  files,
  oldFileUrl,
  onChange,
  onDelete,
  onRemove,
  onRemoveAll,
  thumbnail,
  sx,
  accept,
  ...other
}) {
  const [previewFiles, setPreviewFiles] = useState(multiple ? files || [] : file || null);

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    multiple,
    disabled,
    onDrop: (acceptedFiles) => {
      if (multiple) {
        const updatedFiles = [...previewFiles, ...acceptedFiles];
        setPreviewFiles(updatedFiles);
        onChange?.(updatedFiles);
      } else {
        const singleFile = acceptedFiles[0];
        setPreviewFiles(singleFile);
        onChange?.([singleFile]);
      }
    },
    ...other,
  });

  useEffect(() => {
    setPreviewFiles(multiple ? files || [] : file || null);
  }, [files, file, multiple]);

  const hasFile = (!!previewFiles && !multiple) || (!!oldFileUrl && !multiple);

  const hasFiles = multiple && previewFiles.length > 0;
  const hasError = isDragReject || !!error;

  return (
    <Box sx={{ width: 1, position: 'relative', ...sx }}>
      <Box
        {...getRootProps()}
        sx={{
          p: 5,
          outline: 'none',
          borderRadius: 1,
          cursor: 'pointer',
          overflow: 'hidden',
          position: 'relative',
          height: hasFile ? '250px' : 'auto',
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
          border: (theme) => `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
          transition: (theme) => theme.transitions.create(['opacity', 'padding']),
          '&:hover': { opacity: 0.72 },
          ...(isDragActive && { opacity: 0.72 }),
          ...(disabled && { opacity: 0.48, pointerEvents: 'none' }),
          ...(hasError && {
            color: 'error.main',
            borderColor: 'error.main',
            bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
          }),
          ...(hasFile && { padding: '24% 0' }),
        }}
      >
        <input {...getInputProps()} name={name} accept={accept} />

        {/* <SingleFilePreview imgUrl={URL.createObjectURL(previewFiles)} filename={previewFiles.name} /> */}
        {hasFile ? (
          <SingleFilePreview
            imgUrl={
              previewFiles
                ? URL.createObjectURL(previewFiles)
                : STORAGE_API+"/"+oldFileUrl
            }
            filename={
              previewFiles?.name || oldFileUrl?.split('/').pop()
            }
          />
        ) : (
          placeholder || (
            <Stack spacing={3} alignItems="center" justifyContent="center">
              <Typography variant="h6">{label ? label : t(placeholder)}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                <Box component="span" sx={{ mx: 0.5, color: 'primary.main', textDecoration: 'underline' }}>
                  {t("browse")}
                </Box>
                {t("from_your_device")}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {" jpg, jpeg, png, pdf, doc, docx."}
              </Typography>
            </Stack>
          )
        )}
      </Box>

      {hasFile && onDelete && (
        <IconButton
          size="small"
          onClick={onDelete}
          sx={{
            top: 16,
            right: 16,
            zIndex: 9,
            position: 'absolute',
            color: (theme) => alpha(theme.palette.common.white, 0.8),
            bgcolor: (theme) => alpha(theme.palette.grey[900], 0.72),
            '&:hover': { bgcolor: (theme) => alpha(theme.palette.grey[900], 0.48) },
          }}
        >
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      )}

      {hasFiles && (
        <Box sx={{ my: 3 }}>
          <MultiFilePreview
            files={previewFiles}
            thumbnail={thumbnail}
            onRemove={(file) => setPreviewFiles(previewFiles.filter((f) => f !== file))}
          />
        </Box>
      )}

      {hasFiles && onRemoveAll && (
        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button color="inherit" variant="outlined" size="small" onClick={onRemoveAll}>
            Remove All
          </Button>
        </Stack>
      )}

      {helperText && <FormHelperText error={!!error}>{helperText}</FormHelperText>}

      <RejectionFiles fileRejections={fileRejections} />
    </Box>
  );
}

Upload.propTypes = {
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  name: PropTypes.string,
  file: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  files: PropTypes.array,
  helperText: PropTypes.string,
  multiple: PropTypes.bool,
  thumbnail: PropTypes.bool,
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
  onRemove: PropTypes.func,
  onRemoveAll: PropTypes.func,
  sx: PropTypes.object,
};
