import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import { alpha, keyframes } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import { useGetMedia, uploadMedia, deleteMedia } from 'src/api/media';
import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ── Animations ──────────────────────────────────────────────────────────

const checkPop = keyframes`
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const breathe = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.08); opacity: 1; }
`;

// ── Component ───────────────────────────────────────────────────────────

export default function MediaPickerDialog({ open, onClose, onSelect, multiple = false, selectable = true, title, confirmLabel }) {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);

  const [selectedMedia, setSelectedMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Local previews keyed by real server ID (assigned after upload response)
  // Shape: Map<serverId, blobUrl>
  const [localPreviewMap, setLocalPreviewMap] = useState(new Map());

  const { media, mediaLoading, mediaValidating, mutate } = useGetMedia(1, 100);

  const serverMediaCount = (media || []).length;

  // ── Display: merge server items with local blob overrides ──
  const displayMedia = useMemo(() => {
    const serverItems = media || [];

    if (localPreviewMap.size === 0) return serverItems;

    // For items that have a local blob preview, use the blob URL instead of server URL
    const merged = serverItems.map((item) => {
      const blobUrl = localPreviewMap.get(item.id);
      if (blobUrl) {
        return { ...item, full_url: blobUrl, _hasLocalPreview: true };
      }
      return item;
    });

    return merged;
  }, [localPreviewMap, media]);

  const isEmpty = displayMedia.length === 0;

  // ── Background: verify server images ready, then clear local blobs ──
  useEffect(() => {
    if (localPreviewMap.size === 0) return;

    let active = true;
    let timer;

    const checkImages = async () => {
      const entries = Array.from(localPreviewMap.entries());
      const serverItems = media || [];

      // Check each local preview's server counterpart
      const results = await Promise.all(
        entries.map(async ([serverId]) => {
          const serverItem = serverItems.find((m) => m.id === serverId);
          if (!serverItem) return { serverId, ready: false };

          // Test if the server image is actually loadable
          const ready = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = serverItem.full_url;
          });

          return { serverId, ready };
        })
      );

      if (!active) return;

      const readyIds = results.filter((r) => r.ready).map((r) => r.serverId);

      if (readyIds.length > 0) {
        setLocalPreviewMap((prev) => {
          const next = new Map(prev);
          readyIds.forEach((id) => {
            const blobUrl = next.get(id);
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            next.delete(id);
          });
          return next;
        });
      }

      // If some still pending, keep polling
      const stillPending = results.filter((r) => !r.ready);
      if (stillPending.length > 0 && active) {
        timer = setTimeout(() => {
          if (active) mutate();
        }, 3000);
      }
    };

    checkImages();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [localPreviewMap, media, mutate]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleToggleMedia = useCallback(
    (mediaItem) => {
      setSelectedMedia((prev) => {
        const isSelected = prev.some((item) => item.id === mediaItem.id);

        if (multiple) {
          return isSelected
            ? prev.filter((item) => item.id !== mediaItem.id)
            : [...prev, mediaItem];
        }

        return isSelected ? [] : [mediaItem];
      });
    },
    [multiple]
  );

  const handleUploadFiles = useCallback(
    async (files) => {
      try {
        setUploading(true);

        // Create blob URLs for instant preview
        const blobUrls = files.map((file) => URL.createObjectURL(file));

        const response = await uploadMedia(files);

        // Extract server IDs from response
        const uploadedItems = response?.data?.data || [];

        // Map each server ID to its local blob URL
        const newEntries = new Map();
        uploadedItems.forEach((item, index) => {
          if (blobUrls[index]) {
            newEntries.set(item.id, blobUrls[index]);
          }
        });

        setLocalPreviewMap((prev) => new Map([...prev, ...newEntries]));

        // Refresh server list so new items appear in the grid
        mutate();

        enqueueSnackbar(t('media_uploaded_successfully'), { variant: 'success' });
      } catch (error) {
        console.error('Failed to upload media:', error);
        enqueueSnackbar(error.message || t('failed_to_upload_media'), { variant: 'error' });
      } finally {
        setUploading(false);
      }
    },
    [mutate, enqueueSnackbar, t]
  );

  const handleFileInputChange = useCallback(
    (event) => {
      const files = Array.from(event.target.files);
      if (files.length > 0) handleUploadFiles(files);
      event.target.value = '';
    },
    [handleUploadFiles]
  );

  const handleAddClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSelect = useCallback(() => {
    onSelect(multiple ? selectedMedia : selectedMedia[0]);
    setSelectedMedia([]);
    // Revoke remaining blob URLs
    localPreviewMap.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
    setLocalPreviewMap(new Map());
    onClose();
  }, [selectedMedia, multiple, onSelect, onClose, localPreviewMap]);

  const handleCancel = useCallback(() => {
    setSelectedMedia([]);
    localPreviewMap.forEach((blobUrl) => URL.revokeObjectURL(blobUrl));
    setLocalPreviewMap(new Map());
    onClose();
  }, [onClose, localPreviewMap]);

  const handleDeleteMedia = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteMedia(deleteTarget.id);
      setSelectedMedia((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      mutate();
      enqueueSnackbar(t('media_deleted_successfully'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.message || t('failed_to_delete_media'), { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, mutate, enqueueSnackbar, t]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          maxHeight: '75vh',
        },
      }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* ── Header ── */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1.5,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:gallery-bold-duotone" width={18} sx={{ color: 'primary.main' }} />
          </Box>

          <Stack spacing={0}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {title || t('media_library')}
            </Typography>
            {serverMediaCount > 0 && (
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.68rem' }}>
                {t('photos_count', { count: serverMediaCount })}
              </Typography>
            )}
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Button
            size="small"
            variant="soft"
            color="primary"
            startIcon={<Iconify icon="solar:add-circle-bold" width={18} />}
            onClick={handleAddClick}
            disabled={uploading}
            sx={{
              height: 32,
              fontSize: '0.78rem',
              fontWeight: 600,
              px: 1.5,
              borderRadius: 1.5,
              textTransform: 'none',
            }}
          >
            {uploading ? t('uploading') : t('add')}
          </Button>

          <IconButton
            size="small"
            onClick={() => mutate()}
            disabled={mediaLoading || mediaValidating}
            sx={{
              width: 32,
              height: 32,
              color: 'text.disabled',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <Iconify
              icon="solar:refresh-bold"
              width={16}
              sx={mediaValidating ? { animation: `${spin} 0.8s linear infinite` } : {}}
            />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleCancel}
            sx={{
              width: 32,
              height: 32,
              color: 'text.disabled',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <Iconify icon="mingcute:close-line" width={16} />
          </IconButton>
        </Stack>
      </Stack>

      {/* ── Upload progress ── */}
      {uploading && (
        <LinearProgress
          sx={{
            height: 2,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
            '& .MuiLinearProgress-bar': { borderRadius: 2 },
          }}
        />
      )}

      {/* ── Content ── */}
      <DialogContent
        sx={{
          p: 2,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          ...(isEmpty && !mediaLoading && { justifyContent: 'center', alignItems: 'center' }),
        }}
      >
        {mediaLoading && displayMedia.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress size={28} thickness={4} />
          </Stack>
        ) : isEmpty ? (
          /* ── Empty state ── */
          <Stack
            alignItems="center"
            spacing={2.5}
            onClick={handleAddClick}
            sx={{
              py: 4,
              px: 3,
              cursor: 'pointer',
              borderRadius: 3,
              border: (theme) => `2px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02),
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              width: '100%',
              maxWidth: 320,
              '&:hover': {
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                '& .empty-icon-wrap': {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                },
              },
            }}
          >
            <Box
              className="empty-icon-wrap"
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.06),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.25s',
                animation: `${breathe} 3s ease-in-out infinite`,
              }}
            >
              <Iconify icon="solar:cloud-upload-bold-duotone" width={32} sx={{ color: 'text.disabled' }} />
            </Box>

            <Stack spacing={0.5} alignItems="center">
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {t('no_media_found')}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'text.disabled', textAlign: 'center', lineHeight: 1.5 }}
              >
                {t('upload_media_to_get_started')}
              </Typography>
            </Stack>
          </Stack>
        ) : (
          /* ── Photo grid ── */
          <Grid container spacing={1}>
            {displayMedia.map((item) => (
              <Grid item xs={4} sm={3} key={item.id}>
                <MediaCard
                  item={item}
                  selected={selectable && selectedMedia.some((m) => m.id === item.id)}
                  selectable={selectable}
                  onToggle={() => selectable && handleToggleMedia(item)}
                  onDelete={() => setDeleteTarget(item)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      {/* ── Footer ── */}
      <DialogActions
        sx={{
          px: 2.5,
          py: 1.5,
          borderTop: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
        }}
      >
        <Button onClick={handleCancel} color="inherit" sx={{ fontWeight: 500 }}>
          {t('cancel')}
        </Button>
        <Button
          onClick={selectable ? handleSelect : handleCancel}
          variant="contained"
          disabled={selectable && selectedMedia.length === 0}
          sx={{
            minWidth: 100,
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          {confirmLabel || (selectable && selectedMedia.length > 0 ? `${t('select')} (${selectedMedia.length})` : t('select'))}
        </Button>
      </DialogActions>

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('delete_media')}
        content={t('are_you_sure_delete_media')}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteMedia}
            disabled={deleting}
          >
            {deleting ? t('deleting') : t('delete')}
          </Button>
        }
      />
    </Dialog>
  );
}

MediaPickerDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func,
  multiple: PropTypes.bool,
  selectable: PropTypes.bool,
  title: PropTypes.string,
  confirmLabel: PropTypes.string,
};

// ── MediaCard ───────────────────────────────────────────────────────────

function MediaCard({ item, selected, selectable = true, onToggle, onDelete }) {
  return (
    <Box
      onClick={selectable ? onToggle : undefined}
      sx={{
        position: 'relative',
        width: '100%',
        paddingTop: '100%',
        borderRadius: 1.5,
        overflow: 'hidden',
        cursor: selectable ? 'pointer' : 'default',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: (theme) =>
          selected
            ? `3px solid ${theme.palette.primary.main}`
            : '3px solid transparent',
        outlineOffset: -3,
        boxShadow: (theme) =>
          selected
            ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}, 0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`
            : 'none',
        transform: selected ? 'scale(0.95)' : 'scale(1)',
        '&:hover': {
          transform: selected ? 'scale(0.95)' : selectable ? 'scale(1.03)' : 'scale(1)',
          boxShadow: (theme) =>
            selected
              ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}, 0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`
              : selectable
                ? `0 4px 16px ${alpha(theme.palette.common.black, 0.1)}`
                : 'none',
          '& .media-delete-btn': { opacity: 1 },
        },
      }}
    >
      <Box
        component="img"
        src={item.full_url}
        alt={item.alt_text || ''}
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

      {/* Selection scrim — gradient from bottom for depth */}
      {selected && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: (theme) =>
              `linear-gradient(to top, ${alpha(theme.palette.primary.darker || theme.palette.primary.dark, 0.35)} 0%, ${alpha(theme.palette.primary.main, 0.12)} 60%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Check badge */}
      {selected && (
        <Box
          sx={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 26,
            height: 26,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `${checkPop} 0.3s cubic-bezier(0.4, 0, 0.2, 1)`,
            boxShadow: (theme) =>
              `0 2px 8px ${alpha(theme.palette.primary.main, 0.5)}, 0 0 0 2px ${alpha(theme.palette.common.white, 0.9)}`,
          }}
        >
          <Iconify icon="eva:checkmark-fill" width={16} sx={{ color: 'white' }} />
        </Box>
      )}

      {/* Delete button — shown on hover when not selectable */}
      {!selectable && onDelete && (
        <IconButton
          className="media-delete-btn"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 28,
            height: 28,
            opacity: 0,
            transition: 'opacity 0.2s',
            bgcolor: (theme) => alpha(theme.palette.error.main, 0.85),
            color: 'common.white',
            '&:hover': {
              bgcolor: 'error.dark',
            },
          }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={15} />
        </IconButton>
      )}
    </Box>
  );
}

MediaCard.propTypes = {
  item: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  selectable: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
};
