import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

import { useOffSetTop } from 'src/hooks/use-off-set-top';
import { useResponsive } from 'src/hooks/use-responsive';

import { bgBlur } from 'src/theme/css';

import Logo from 'src/components/logo';
import SvgColor from 'src/components/svg-color';
import { useSettingsContext } from 'src/components/settings';
import { useTranslate } from 'src/locales';

import Searchbar from '../common/searchbar';
import { NAV, HEADER } from '../config-layout';
import SettingsButton from '../common/settings-button';
import LanguagePopover from '../common/language-popover';
import { useState } from 'react';

import { Icon } from '@iconify/react';
import SettingsLink from '../common/settings-link';

// ----------------------------------------------------------------------

export default function Header({ onOpenNav }) {
  const theme = useTheme();

  const settings = useSettingsContext();

  const { t } = useTranslate();

  const isNavHorizontal = settings.themeLayout === 'horizontal';

  const isNavMini = settings.themeLayout === 'mini';

  const lgUp = useResponsive('up', 'lg');

  const offset = useOffSetTop(HEADER.H_DESKTOP);

  const offsetTop = offset && !isNavHorizontal;

  const [darkMode, setDarkMode] = useState(settings.themeMode);

  const Toggle = () => {
    const mode = darkMode == "dark" ? "light" : "dark"
    setDarkMode(mode)
    settings.onUpdate('themeMode', mode)
  }

  const renderContent = (
    <>
      {lgUp && isNavHorizontal && <Logo sx={{ mr: 2.5 }} />}

      {!lgUp && (
        <IconButton onClick={onOpenNav} aria-label="Open navigation">
          <SvgColor src="/assets/icons/navbar/ic_menu_item.svg" />
        </IconButton>
      )}

      <Searchbar />

      <Stack
        flexGrow={1}
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        spacing={{ xs: 0.5, sm: 1 }}
      >


        <IconButton
          onClick={Toggle}
          aria-label={darkMode === 'dark' ? t('switch_to_light_mode') : t('switch_to_dark_mode')}
          sx={{ width: 40, height: 40 }}
        >
          <Icon
            icon={darkMode === 'dark' ? 'duo-icons:moon-stars' : 'duo-icons:sun'}
            width={24}
            height={24}
            style={darkMode === 'dark' ? { color: '#fffefe' } : undefined}
          />
        </IconButton>


        <LanguagePopover />

        {/* <NotificationsPopover /> */}

        {/* <ContactsPopover /> */}

        {/* <SettingsButton /> */}
        {/* <Link  href={paths?.dashboard.settings.root} >
          <Iconify icon="solar:settings-bold-duotone" width={24} />
        </Link> */}
        <SettingsLink />
        <SettingsButton />
      </Stack>
    </>
  );

  return (
    <AppBar
      sx={{
        height: HEADER.H_MOBILE,
        zIndex: theme.zIndex.appBar + 1,
        ...bgBlur({
          color: theme.palette.background.default,
        }),
        transition: theme.transitions.create(['height'], {
          duration: theme.transitions.duration.shorter,
        }),
        ...(lgUp && {
          width: `calc(100% - ${NAV.W_VERTICAL + 1}px)`,
          height: HEADER.H_DESKTOP,
          ...(offsetTop && {
            height: HEADER.H_DESKTOP_OFFSET,
          }),
          ...(isNavHorizontal && {
            width: 1,
            bgcolor: 'background.default',
            height: HEADER.H_DESKTOP_OFFSET,
            borderBottom: `dashed 1px ${theme.palette.divider}`,
          }),
          ...(isNavMini && {
            width: `calc(100% - ${NAV.W_MINI + 1}px)`,
          }),
        }),
      }}
    >
      <Toolbar
        sx={{
          height: 1,
          px: { lg: 5 },
        }}
      >
        {renderContent}
      </Toolbar>
    </AppBar>
  );
}

Header.propTypes = {
  onOpenNav: PropTypes.func,
};
