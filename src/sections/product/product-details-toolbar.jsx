import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import { useTranslate } from 'src/locales';
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export default function ProductDetailsToolbar({
  publish,
  backLink,
  editLink,
  costsLink,
  liveLink,
  publishOptions,
  onChangePublish,
  sx,
  ...other
}) {
  const popover = usePopover();
  const { t } = useTranslate();

  const isPublished = publish === 'published';

  return (
    <>
      <Stack
        spacing={1}
        direction="row"
        alignItems="center"
        sx={{
          mb: { xs: 3, md: 4 },
          ...sx,
        }}
        {...other}
      >
        <Button
          component={RouterLink}
          href={backLink}
          color="inherit"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={18} />}
          sx={{
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            typography: 'body2',
            fontWeight: 500,
            '&:hover': {
              bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
            },
          }}
        >
          {t('back')}
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="row" spacing={0.5} alignItems="center">
          {/* {isPublished && (
            <Tooltip title={t('go_live')} arrow>
              <IconButton
                component={RouterLink}
                href={liveLink}
                size="small"
                sx={{
                  color: 'primary.main',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
                  },
                }}
              >
                <Iconify icon="eva:external-link-fill" width={18} />
              </IconButton>
            </Tooltip>
          )} */}

          {costsLink && (
            <Button
              component={RouterLink}
              href={costsLink}
              size="small"
              variant="soft"
              color="info"
              startIcon={<Iconify icon="solar:tag-price-bold-duotone" width={18} />}
              sx={{
                px: 1.5,
                py: 0.75,
                fontWeight: 600,
                fontSize: '0.8125rem',
              }}
            >
              {t('manage_costs')}
            </Button>
          )}

          <Tooltip title={t('edit')} arrow>
            <IconButton
              component={RouterLink}
              href={editLink}
              size="small"
              sx={{
                color: 'text.secondary',
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                '&:hover': {
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.16),
                },
              }}
            >
              <Iconify icon="solar:pen-bold" width={18} />
            </IconButton>
          </Tooltip>

          <LoadingButton
            color={isPublished ? 'success' : 'warning'}
            variant="soft"
            size="small"
            loading={!publish}
            loadingIndicator={t('loading')}
            endIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={16} />}
            onClick={popover.onOpen}
            sx={{
              ml: 0.5,
              px: 1.5,
              py: 0.75,
              minWidth: 100,
              textTransform: 'capitalize',
              fontWeight: 600,
              fontSize: '0.8125rem',
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
  costsLink: PropTypes.string,
  editLink: PropTypes.string,
  liveLink: PropTypes.string,
  onChangePublish: PropTypes.func,
  publish: PropTypes.string,
  publishOptions: PropTypes.array,
  sx: PropTypes.object,
};
