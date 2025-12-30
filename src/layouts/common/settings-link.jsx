import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Badge, { badgeClasses } from '@mui/material/Badge';

import Iconify from 'src/components/iconify';
import { varHover } from 'src/components/animate';
import { useSettingsContext } from 'src/components/settings';
import { useTranslate } from 'src/locales';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function SettingsLink({ sx }) {
  const settings = useSettingsContext();
  const router = useRouter()
  const { t } = useTranslate();

  return (
    // <Badge
    //   color="error"
    //   variant="dot"
    //   invisible={!settings.canReset}
    //   sx={{
    //     [`& .${badgeClasses.badge}`]: {
    //       top: 8,
    //       right: 8,
    //     },
    //     ...sx,
    //   }}
    // >
      <Box
        component={m.div}
        // animate={{
        //   rotate: [0, settings.open ? 0 : 360],
        // }}
        transition={{
          duration: 12,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        <IconButton
          component={m.button}
          whileTap="tap"
          whileHover="hover"
          variants={varHover(1.05)}
          aria-label={t("settings")}
          onClick={()=>{router.push(paths?.dashboard.settings.root)}}
          sx={{
            width: 40,
            height: 40,
          }}
        >
          <Iconify icon="solar:settings-bold-duotone" width={24} />
          {/* <Iconify icon="solar:archive-down-minimlistic-bold-duotone" width={24} /> */}
        </IconButton>
      </Box>
    // {/* </Badge> */}
  );
}

SettingsLink.propTypes = {
  sx: PropTypes.object,
};
