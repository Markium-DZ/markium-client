import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { alpha } from '@mui/material/styles';
import { Divider } from '@mui/material';

import { useTranslate } from 'src/locales';
import { useGetMedia, uploadMedia, deleteMedia, updateMediaAltText } from 'src/api/media';
import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import { fDate } from 'src/utils/format-time';
import { fData } from 'src/utils/format-number';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { captureEvent } from 'src/utils/posthog';
import showError from 'src/utils/show_error';
import { LoadingScreen } from 'src/components/loading-screen';
import Lightbox, { useLightBox } from 'src/components/lightbox';
import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

// ----------------------------------------------------------------------

export default function MediaListView() {
  const settings = useSettingsContext();
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();

  const [page, setPage] = useState(1);
  const [allMedia, setAllMedia] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const perPage = 20;
  const { media, mediaLoading, mediaError, totalPages, mutate } = useGetMedia(page, perPage);

  // Append new media to existing list
  useEffect(() => {
    if (media && media.length > 0) {
      setAllMedia((prev) => {
        // Avoid duplicates by checking IDs
        const existingIds = new Set(prev.map(item => item.id));
        const newItems = media.filter(item => !existingIds.has(item.id));
        return [...prev, ...newItems];
      });
    }
  }, [media]);

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    if (mediaLoading || page >= totalPages) return;

    const scrolledToBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;

    if (scrolledToBottom) {
      setPage((prev) => prev + 1);
    }
  }, [mediaLoading, page, totalPages]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Group media by creation date
  const groupedMedia = allMedia.reduce((groups, item) => {
    const date = fDate(item.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  // Lightbox slides from all media
  const slides = useMemo(
    () => allMedia.map((item) => ({ src: item.full_url })),
    [allMedia]
  );

  const lightbox = useLightBox(slides);

  const handlePreview = useCallback((item) => {
    lightbox.onOpen(item.full_url);
  }, [lightbox]);

  // Handle file upload
  const handleFileSelect = useCallback(async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      await uploadMedia(files);
      captureEvent('media_uploaded', { count: files.length });

      // Reset page and media to refresh from beginning
      setPage(1);
      setAllMedia([]);
      mutate();

      enqueueSnackbar(t('media_uploaded_successfully'), { variant: 'success' });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload media:', error);
      enqueueSnackbar(error.message || t('failed_to_upload_media'), { variant: 'error' });
    } finally {
      setUploading(false);
    }
  }, [mutate, enqueueSnackbar, t]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle media deletion
  const handleDeleteMedia = useCallback(async (mediaId) => {
    try {
      await deleteMedia(mediaId);

      // Remove from local state
      setAllMedia((prev) => prev.filter((item) => item.id !== mediaId));

      enqueueSnackbar(t('media_deleted_successfully'), { variant: 'success' });
    } catch (error) {
      console.error('Failed to delete media:', error);
      showError(error);
    }
  }, [enqueueSnackbar, t]);

  // Handle alt text update
  const handleUpdateAltText = useCallback(async (mediaId, newAltText) => {
    try {
      await updateMediaAltText(mediaId, newAltText);
      setAllMedia((prev) =>
        prev.map((item) => (item.id === mediaId ? { ...item, alt_text: newAltText } : item))
      );
      enqueueSnackbar(t('alt_text_updated'), { variant: 'success' });
    } catch (error) {
      console.error('Failed to update alt text:', error);
      showError(error);
    }
  }, [enqueueSnackbar, t]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">{t('media')}</Typography>

        <Button
          variant="contained"
          startIcon={uploading ? <CircularProgress size={20} /> : <Iconify icon="eva:plus-fill" />}
          onClick={handleUploadClick}
          disabled={uploading}
        >
          {uploading ? t('uploading') : t('upload_media')}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Stack>

      {mediaError && allMedia.length === 0 && !mediaLoading && (
        <Alert severity="warning" icon={<Iconify icon="solar:cloud-cross-bold" width={22} />} sx={{ mb: 2 }}>
          {t('no_connection_notice')}
        </Alert>
      )}

      <Box ref={scrollContainerRef}>
        {Object.keys(groupedMedia).length === 0 && !mediaLoading && (
          <Card sx={{ p: 5, textAlign: 'center' }}>
            <Iconify icon="solar:gallery-bold" width={64} sx={{ mx: 'auto', color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {t('no_media_found')}
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              {t('upload_media_to_get_started')}
            </Typography>
          </Card>
        )}

        {Object.entries(groupedMedia).map(([date, items]) => (
          <Box key={date} sx={{ mb: 4 }}>

            <Divider orientation="horizontal" sx={{ mt: 4, display: 'flex' }} />
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2, mt: 2, display: 'flex', alignItems: 'center', fontWeight: 600 }} >
              <Iconify icon="solar:calendar-bold" width="20px" height="20px" sx={{ mr: 1, color: 'primary.main' }} />
              {date}
            </Typography>

            <Grid container spacing={2}>
              {items.map((item) => (
                <Grid item xs={4} sm={3} md={2} lg={1.5} key={item.id}>
                  <MediaItem
                    item={item}
                    onDelete={handleDeleteMedia}
                    onPreview={handlePreview}
                    onUpdateAltText={handleUpdateAltText}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        {mediaLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <LoadingScreen />
          </Box>
        )}
      </Box>

      <Lightbox
        index={lightbox.selected}
        slides={slides}
        open={lightbox.open}
        close={lightbox.onClose}
        onGetCurrentIndex={(index) => lightbox.setSelected(index)}
      />
    </Container>
  );
}

// ----------------------------------------------------------------------

function MediaItem({ item, onDelete, onPreview, onUpdateAltText }) {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const { copy } = useCopyToClipboard();
  const popover = usePopover();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [altTextDialog, setAltTextDialog] = useState(false);
  const [altTextValue, setAltTextValue] = useState(item.alt_text || '');

  const handleDeleteClick = useCallback(() => {
    popover.onClose();
    setConfirmDelete(true);
  }, [popover]);

  const handleConfirmDelete = useCallback(async () => {
    setConfirmDelete(false);
    await onDelete(item.id);
  }, [onDelete, item.id]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDelete(false);
  }, []);

  const handleCopyUrl = useCallback(() => {
    popover.onClose();
    copy(item.full_url);
    enqueueSnackbar(t('url_copied'), { variant: 'success' });
  }, [copy, item.full_url, popover, enqueueSnackbar, t]);

  const handlePreviewClick = useCallback(() => {
    popover.onClose();
    onPreview(item);
  }, [popover, onPreview, item]);

  const handleEditAltText = useCallback(() => {
    popover.onClose();
    setAltTextValue(item.alt_text || '');
    setAltTextDialog(true);
  }, [popover, item.alt_text]);

  const handleSaveAltText = useCallback(async () => {
    setAltTextDialog(false);
    await onUpdateAltText(item.id, altTextValue);
  }, [onUpdateAltText, item.id, altTextValue]);

  return (
    <>
      <Card
        sx={{
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: (theme) => theme.customShadows.z8,
            transform: 'scale(1.02)',
            '& .media-overlay': {
              opacity: 1,
            },
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
        }}
        onClick={() => onPreview(item)}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: '100%', // 1:1 aspect ratio
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

          <Box
            className="media-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: (theme) =>
                `linear-gradient(to bottom, ${alpha(theme.palette.common.black, 0.0)} 0%, ${alpha(theme.palette.common.black, 0.8)} 100%)`,
              opacity: 0,
              transition: 'opacity 0.2s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              p: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  popover.onOpen(e);
                }}
                sx={{
                  color: 'white',
                  bgcolor: (theme) => alpha(theme.palette.common.black, 0.4),
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.common.black, 0.6),
                  },
                }}
              >
                <Iconify icon="eva:more-vertical-fill" width={18} />
              </IconButton>
            </Box>

            <Stack spacing={0.5}>
              {item.alt_text && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.alt_text}
                </Typography>
              )}

              <Stack direction="row" spacing={1} sx={{ typography: 'caption', color: 'grey.400', fontSize: '0.7rem' }}>
                <Box>
                  {item.width} × {item.height}
                </Box>
                <Box>{fData(item.file_size)}</Box>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Card>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 160 }}
      >
        <MenuItem onClick={handlePreviewClick}>
          <Iconify icon="solar:eye-bold" />
          {t('preview')}
        </MenuItem>

        <MenuItem onClick={handleCopyUrl}>
          <Iconify icon="solar:copy-bold" />
          {t('copy_link')}
        </MenuItem>

        <MenuItem onClick={handleEditAltText}>
          <Iconify icon="solar:pen-bold" />
          {t('edit_alt_text')}
        </MenuItem>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuItem
          onClick={handleDeleteClick}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          {t('delete')}
        </MenuItem>
      </CustomPopover>

      {/* Alt Text Edit Dialog */}
      <Dialog
        open={altTextDialog}
        onClose={() => setAltTextDialog(false)}
        maxWidth="sm"
        fullWidth
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>{t('edit_alt_text')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            value={altTextValue}
            onChange={(e) => setAltTextValue(e.target.value)}
            placeholder={t('edit_alt_text')}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAltTextDialog(false)}>{t('cancel')}</Button>
          <Button variant="contained" onClick={handleSaveAltText}>{t('save')}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onClose={handleCancelDelete}
        title={t('delete_media')}
        content={t('are_you_sure_delete_media')}
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            {t('delete')}
          </Button>
        }
      />
    </>
  );
}

MediaItem.propTypes = {
  item: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPreview: PropTypes.func.isRequired,
  onUpdateAltText: PropTypes.func.isRequired,
};
