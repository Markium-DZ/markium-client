import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import { useGetMedia, uploadMedia } from 'src/api/media';
import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import { Upload } from 'src/components/upload';
import { fData } from 'src/utils/format-number';
import { STORAGE_API } from 'src/config-global';

// ----------------------------------------------------------------------

export default function MediaPickerDialog({ open, onClose, onSelect, multiple = false, title }) {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();

  const [selectedMedia, setSelectedMedia] = useState([]);
  const [localPreviews, setLocalPreviews] = useState([]); // Local previews for immediate display
  const [uploading, setUploading] = useState(false);

  const { media, mediaLoading, mediaValidating, mutate } = useGetMedia(1, 100);

  // Combine local previews with server media (local previews first)
  const allMedia = [...localPreviews, ...(media || [])];

  const handleToggleMedia = useCallback((mediaItem) => {
    setSelectedMedia((prev) => {
      const isSelected = prev.some((item) => item.id === mediaItem.id);

      if (multiple) {
        if (isSelected) {
          return prev.filter((item) => item.id !== mediaItem.id);
        }
        return [...prev, mediaItem];
      }

      // Single selection
      return isSelected ? [] : [mediaItem];
    });
  }, [multiple]);

  const handleDrop = useCallback(async (acceptedFiles) => {
    try {
      setUploading(true);

      // Create local previews immediately for instant feedback
      const previews = acceptedFiles.map((file, index) => ({
        id: `local-${Date.now()}-${index}`,
        full_url: URL.createObjectURL(file),
        alt_text: file.name,
        width: 0,
        height: 0,
        file_size: file.size,
        isLocal: true, // Flag to identify local previews
      }));
      setLocalPreviews((prev) => [...previews, ...prev]);

      await uploadMedia(acceptedFiles);

      // Refresh media list immediately
      mutate();

      // Auto-refresh after delay to ensure media is fully created on backend
      // Then remove local previews as server data should be available
      setTimeout(() => {
        mutate();
      }, 1500);

      setTimeout(() => {
        mutate();
        // Remove local previews after server data is likely available
        setLocalPreviews([]);
      }, 3000);

      enqueueSnackbar(t('media_uploaded_successfully'), { variant: 'success' });
    } catch (error) {
      console.error('Failed to upload media:', error);
      enqueueSnackbar(error.message || t('failed_to_upload_media'), { variant: 'error' });
      // Remove local previews on error
      setLocalPreviews([]);
    } finally {
      setUploading(false);
    }
  }, [mutate, enqueueSnackbar, t]);

  const handleSelect = useCallback(() => {
    // Filter out local previews from selection (they can't be used as actual media)
    const validSelection = selectedMedia.filter((item) => !item.isLocal);
    onSelect(multiple ? validSelection : validSelection[0]);

    // Reset state
    setSelectedMedia([]);
    setLocalPreviews([]);

    onClose();
  }, [selectedMedia, multiple, onSelect, onClose]);

  const handleCancel = useCallback(() => {
    setSelectedMedia([]);
    setLocalPreviews([]);
    onClose();
  }, [onClose]);

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' },
      }}
    >
      <DialogTitle>
        {title || t('select_media')}
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Upload Section */}
          <Box>
            <Upload
              multiple
              onDrop={handleDrop}
              disabled={uploading}
              accept={{ 'image/*': [] }}
              placeholder={
                <Stack spacing={2.5} alignItems="center" sx={{ py: 2 }}>
                  {/* Upload Icon */}
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    }}
                  >
                    <Iconify
                      icon="eva:cloud-upload-fill"
                      width={40}
                      sx={{ color: 'primary.main' }}
                    />
                  </Box>

                  {/* Upload Text */}
                  <Stack spacing={0.5} alignItems="center">
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {t('drop_or_select_file')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {t('supported_formats')}: JPG, PNG, GIF (max 3MB)
                    </Typography>
                  </Stack>
                </Stack>
              }
            />

            {uploading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>{t('uploading')}</Typography>
              </Box>
            )}
          </Box>

          <Divider />

          {/* Media Library Section */}
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6">
                {t('media_library')}
              </Typography>
              <Button
                size="small"
                startIcon={<Iconify icon="solar:refresh-bold" />}
                onClick={handleRefresh}
                disabled={mediaLoading || mediaValidating}
              >
                {mediaValidating ? t('refreshing') : t('refresh')}
              </Button>
            </Stack>

            {mediaLoading && localPreviews.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            ) : allMedia.length > 0 ? (
              <Grid container spacing={2}>
                {allMedia.map((item) => (
                  <Grid item xs={6} sm={4} md={3} key={item.id}>
                    <MediaCard
                      item={item}
                      selected={selectedMedia.some((m) => m.id === item.id)}
                      onToggle={() => handleToggleMedia(item)}
                      isLocal={item.isLocal}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Iconify icon="solar:gallery-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {t('no_media_found')}
                </Typography>
                <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                  {t('upload_media_to_get_started')}
                </Typography>
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleCancel} color="inherit">
          {t('cancel')}
        </Button>
        <Button
          onClick={handleSelect}
          variant="contained"
          disabled={selectedMedia.length === 0}
        >
          {t('select')} {selectedMedia.length > 0 && `(${selectedMedia.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

MediaPickerDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  multiple: PropTypes.bool,
  title: PropTypes.string,
};

// ----------------------------------------------------------------------

function MediaCard({ item, selected, onToggle, isLocal }) {
  return (
    <Card
      onClick={isLocal ? undefined : onToggle}
      sx={{
        position: 'relative',
        cursor: isLocal ? 'default' : 'pointer',
        transition: 'all 0.2s',
        border: (theme) => `2px solid ${selected ? theme.palette.primary.main : 'transparent'}`,
        opacity: isLocal ? 0.7 : 1,
        '&:hover': {
          boxShadow: isLocal ? 'none' : (theme) => theme.customShadows.z8,
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          paddingTop: '100%',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={item.full_url}
          alt={item.alt_text || 'Media'}
          loading="lazy"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Loading overlay for local previews */}
        {isLocal && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => alpha(theme.palette.common.black, 0.4),
            }}
          >
            <CircularProgress size={24} sx={{ color: 'white' }} />
          </Box>
        )}

        {selected && !isLocal && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="eva:checkmark-fill" width={16} sx={{ color: 'white' }} />
          </Box>
        )}

        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: (theme) => alpha(theme.palette.common.black, 0.6),
            p: 0.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'white',
              fontSize: '0.65rem',
              display: 'block',
              textAlign: 'center',
            }}
          >
            {isLocal ? item.alt_text : `${item.width} × ${item.height} • ${fData(item.file_size)}`}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}

MediaCard.propTypes = {
  item: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  isLocal: PropTypes.bool,
};
