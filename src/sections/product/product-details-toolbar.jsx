import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

const iconBtnSx = {
  width: 36,
  height: 36,
  color: 'text.secondary',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  '&:hover': {
    bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
    borderColor: 'text.disabled',
  },
};

// ----------------------------------------------------------------------

export default function ProductDetailsToolbar({
  publish,
  backLink,
  editLink,
  liveLink,
  publishOptions,
  onChangePublish,
  publicProductUrl,
  onCopyLink,
  loading,
  sx,
  ...other
}) {
  const popover = usePopover();
  const { t } = useTranslate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isPublished = publish === 'published';

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          mb: { xs: 2, md: 3 },
          ...sx,
        }}
        {...other}
      >
        {/* Back */}
        {!isMobile && (
          <Tooltip title={t('back')} arrow>
            <IconButton
              component={RouterLink}
              href={backLink}
              sx={{
                ...iconBtnSx,
                mr: 1,
              }}
            >
              <Iconify
                icon="eva:arrow-ios-back-fill"
                width={18}
                sx={{ transform: theme.direction === 'rtl' ? 'scaleX(-1)' : 'none' }}
              />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ flexGrow: 1 }} />

        {/* Actions row */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{
            p: 0.5,
            borderRadius: 1.5,
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
            border: '1px solid',
            borderColor: (theme) => alpha(theme.palette.grey[500], 0.08),
          }}
        >
          {/* Edit */}
          <Tooltip title={t('edit')} arrow>
            <IconButton component={RouterLink} href={editLink} sx={iconBtnSx}>
              <Iconify icon="solar:pen-bold" width={17} />
            </IconButton>
          </Tooltip>

          {/* Copy link */}
          {publicProductUrl && (
            <Tooltip title={t('copy_product_link')} arrow>
              <IconButton onClick={onCopyLink} sx={iconBtnSx}>
                <Iconify icon="solar:link-bold" width={17} />
              </IconButton>
            </Tooltip>
          )}

          {/* Open external */}
          {publicProductUrl && (
            <Tooltip title={t('open_in_new_tab')} arrow>
              <IconButton
                component="a"
                href={publicProductUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={iconBtnSx}
              >
                <Iconify icon="solar:square-arrow-right-up-bold" width={17} />
              </IconButton>
            </Tooltip>
          )}

          <Divider orientation="vertical" flexItem sx={{ mx: 0.25, borderStyle: 'dashed' }} />

          {/* Publish status */}
          <LoadingButton
            color={isPublished ? 'success' : 'warning'}
            variant="soft"
            size="small"
            loading={loading}
            loadingIndicator={t('loading')}
            endIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={14} />}
            onClick={popover.onOpen}
            sx={{
              height: 36,
              px: 2,
              minWidth: 110,
              borderRadius: 1,
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: 0.3,
              textTransform: 'capitalize',
            }}
          >
            {isPublished ? t('published') : t('draft')}
          </LoadingButton>
        </Stack>
      </Stack>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="top-right"
        sx={{ width: 160 }}
      >
        {publishOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === publish}
            disabled={option.value === 'draft' && isPublished}
            onClick={() => {
              popover.onClose();
              onChangePublish(option.value);
            }}
            sx={{
              py: 1,
              px: 1.5,
              gap: 1.5,
              typography: 'body2',
              fontWeight: option.value === publish ? 600 : 400,
            }}
          >
            <Iconify
              icon={option.value === 'published' ? 'eva:cloud-upload-fill' : 'solar:file-text-bold'}
              width={18}
              sx={{
                color: option.value === 'published' ? 'success.main' : 'warning.main',
              }}
            />
            {option.value === 'published' ? t('published') : t('draft')}
          </MenuItem>
        ))}
      </CustomPopover>
    </>
  );
}

ProductDetailsToolbar.propTypes = {
  backLink: PropTypes.string,
  editLink: PropTypes.string,
  liveLink: PropTypes.string,
  loading: PropTypes.bool,
  onChangePublish: PropTypes.func,
  onCopyLink: PropTypes.func,
  publish: PropTypes.string,
  publicProductUrl: PropTypes.string,
  publishOptions: PropTypes.array,
  sx: PropTypes.object,
};
