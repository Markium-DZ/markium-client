import PropTypes from 'prop-types';
import Joyride from 'react-joyride';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

// ----------------------------------------------------------------------

export default function Walktour({ steps, run, callback, ...other }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Joyride
      steps={steps}
      run={run}
      callback={callback}
      continuous
      showSkipButton
      showProgress
      disableOverlayClose
      locale={{
        back: t('tour_back'),
        close: t('tour_close'),
        last: t('tour_last'),
        next: t('tour_next'),
        skip: t('tour_skip'),
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: theme.palette.primary.main,
          textColor: theme.palette.text.primary,
          backgroundColor: theme.palette.background.paper,
          arrowColor: theme.palette.background.paper,
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        },
        tooltip: {
          borderRadius: theme.shape.borderRadius * 2,
          padding: theme.spacing(2),
          fontSize: 14,
        },
        tooltipTitle: {
          fontSize: 16,
          fontWeight: 600,
        },
        buttonNext: {
          borderRadius: theme.shape.borderRadius,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 600,
        },
        buttonBack: {
          color: theme.palette.text.secondary,
          marginRight: 8,
          fontSize: 14,
        },
        buttonSkip: {
          color: theme.palette.text.disabled,
          fontSize: 13,
        },
      }}
      {...other}
    />
  );
}

Walktour.propTypes = {
  steps: PropTypes.array.isRequired,
  run: PropTypes.bool.isRequired,
  callback: PropTypes.func,
};
