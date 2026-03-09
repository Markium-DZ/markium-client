import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha, keyframes } from '@mui/material/styles';

import { useTranslate } from 'src/locales';
import { useGetMedia, uploadMedia } from 'src/api/media';
import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';

// ── Animations ──────────────────────────────────────────────────────────

const checkPop = keyframes`
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
`;

// ── Reusable thumbnail ──────────────────────────────────────────────────

function MediaThumbnail({ item, isSelected, onToggle, size = 'normal' }) {
  const checkSize = size === 'large' ? 24 : 20;
  const checkIconSize = size === 'large' ? 16 : 14;

  return (
    <Box
      onClick={() => onToggle(item)}
      sx={{
        position: 'relative',
        width: '100%',
        paddingTop: '100%',
        borderRadius: 1,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: (theme) =>
          isSelected ? `2.5px solid ${theme.palette.primary.main}` : '2.5px solid transparent',
        outlineOffset: -2.5,
        boxShadow: (theme) =>
          isSelected
            ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}, 0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`
            : 'none',
        transform: isSelected ? 'scale(0.96)' : 'scale(1)',
        '&:hover': {
          transform: isSelected ? 'scale(0.96)' : 'scale(1.03)',
          boxShadow: (theme) =>
            isSelected
              ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.3)}, 0 4px 14px ${alpha(theme.palette.primary.main, 0.25)}`
              : `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
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

      {isSelected && (
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

      {isSelected && (
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: checkSize,
            height: checkSize,
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
          <Iconify icon="eva:checkmark-fill" width={checkIconSize} sx={{ color: 'white' }} />
        </Box>
      )}
    </Box>
  );
}

MediaThumbnail.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['normal', 'large']),
};

// ── Component ───────────────────────────────────────────────────────────

export default function InlineMediaPicker({ selectedIds, onToggle, onAdd }) {
  const { t } = useTranslate();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [localPreviewMap, setLocalPreviewMap] = useState(new Map());

  const { media, mediaLoading, mutate } = useGetMedia(1, 100);

  // Merge server items with local blob URL overrides
  const displayMedia = useMemo(() => {
    const serverItems = media || [];
    if (localPreviewMap.size === 0) return serverItems;
    return serverItems.map((item) => {
      const blobUrl = localPreviewMap.get(item.id);
      return blobUrl ? { ...item, full_url: blobUrl } : item;
    });
  }, [localPreviewMap, media]);

  // Background: verify server images ready → clear blob overrides
  useEffect(() => {
    if (localPreviewMap.size === 0) return;

    let active = true;
    let timer;

    const check = async () => {
      const entries = Array.from(localPreviewMap.entries());
      const serverItems = media || [];

      const results = await Promise.all(
        entries.map(async ([serverId]) => {
          const serverItem = serverItems.find((m) => m.id === serverId);
          if (!serverItem) return { serverId, ready: false };
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

      if (results.some((r) => !r.ready) && active) {
        timer = setTimeout(() => {
          if (active) mutate();
        }, 3000);
      }
    };

    check();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [localPreviewMap, media, mutate]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleUpload = useCallback(
    async (files) => {
      try {
        setUploading(true);
        const blobUrls = files.map((f) => URL.createObjectURL(f));

        const response = await uploadMedia(files);
        const uploadedItems = response?.data?.data || [];

        // Map server IDs → blob URLs
        const newEntries = new Map();
        uploadedItems.forEach((item, i) => {
          if (blobUrls[i]) newEntries.set(item.id, blobUrls[i]);
        });
        setLocalPreviewMap((prev) => new Map([...prev, ...newEntries]));

        mutate();

        // Auto-select the newly uploaded items
        if (onAdd) onAdd(uploadedItems);

        enqueueSnackbar(t('media_uploaded_successfully'), { variant: 'success' });
      } catch (error) {
        console.error('Upload failed:', error);
        enqueueSnackbar(error.message || t('failed_to_upload_media'), { variant: 'error' });
      } finally {
        setUploading(false);
      }
    },
    [mutate, onAdd, enqueueSnackbar, t]
  );

  const handleFileChange = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) handleUpload(files);
      e.target.value = '';
    },
    [handleUpload]
  );

  const isEmpty = !mediaLoading && displayMedia.length === 0;

  // Collapsed: show 2 rows (based on largest column count = 6)
  const MAX_VISIBLE = 12;
  const hasMore = displayMedia.length > MAX_VISIBLE;
  const visibleCount = hasMore ? MAX_VISIBLE - 1 : MAX_VISIBLE;
  const visibleMedia = displayMedia.slice(0, visibleCount);
  const hiddenCount = displayMedia.length - visibleCount;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Stack spacing={1.5}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Upload zone */}
      <Box
        onClick={() => fileInputRef.current?.click()}
        sx={{
          py: 2,
          px: 2.5,
          borderRadius: 1.5,
          cursor: 'pointer',
          border: (theme) => `2px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02),
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: (theme) => alpha(theme.palette.primary.main, 0.4),
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:cloud-upload-bold-duotone" width={20} sx={{ color: 'primary.main' }} />
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              {uploading ? t('uploading') : t('upload_photos')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {t('click_or_drag_to_upload')}
            </Typography>
          </Box>

          {/* See all button — inline with upload zone */}
          {displayMedia.length > 0 && (
            <Button
              size="small"
              variant="soft"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              startIcon={<Iconify icon="solar:gallery-wide-bold" width={18} />}
              sx={{ fontWeight: 600, textTransform: 'none', flexShrink: 0 }}
            >
              {t('see_all')} ({displayMedia.length})
            </Button>
          )}
        </Stack>
      </Box>

      {/* Upload progress */}
      {uploading && (
        <LinearProgress
          sx={{
            height: 2,
            borderRadius: 1,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
          }}
        />
      )}

      {/* Compact media grid (2 rows preview) */}
      {mediaLoading ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress size={24} thickness={4} />
        </Stack>
      ) : isEmpty ? (
        <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center', py: 2 }}>
          {t('no_media_found')}
        </Typography>
      ) : (
        <Box>
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(4, 1fr)',
              sm: 'repeat(5, 1fr)',
              md: 'repeat(6, 1fr)',
            }}
            gap={1}
          >
            {visibleMedia.map((item) => (
              <MediaThumbnail
                key={item.id}
                item={item}
                isSelected={selectedIds.has(String(item.id))}
                onToggle={onToggle}
              />
            ))}

            {/* "+N more" tile */}
            {hasMore && (
              <Box
                onClick={() => setModalOpen(true)}
                sx={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '100%',
                  borderRadius: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.16),
                  },
                }}
              >
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  sx={{ position: 'absolute', inset: 0 }}
                >
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                    +{hiddenCount}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {t('more')}
                  </Typography>
                </Stack>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* ── Full Media Modal ─────────────────────────────────────────── */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:gallery-bold" width={22} sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('media_library')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({displayMedia.length})
            </Typography>
          </Stack>
          <IconButton size="small" onClick={() => setModalOpen(false)}>
            <Iconify icon="eva:close-fill" width={22} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2 }}>
          {displayMedia.length === 0 ? (
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ textAlign: 'center', py: 6 }}
            >
              {t('no_media_found')}
            </Typography>
          ) : (
            <Box
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(3, 1fr)',
                sm: 'repeat(4, 1fr)',
                md: 'repeat(5, 1fr)',
              }}
              gap={1.5}
            >
              {displayMedia.map((item) => (
                <MediaThumbnail
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.has(String(item.id))}
                  onToggle={onToggle}
                  size="large"
                />
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

InlineMediaPicker.propTypes = {
  selectedIds: PropTypes.instanceOf(Set).isRequired,
  onToggle: PropTypes.func.isRequired,
  onAdd: PropTypes.func,
};
