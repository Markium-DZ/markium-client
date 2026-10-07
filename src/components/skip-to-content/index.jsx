import Box from '@mui/material/Box';
import { useTranslate } from 'src/locales';

// ----------------------------------------------------------------------

export default function SkipToContent() {
  const { t } = useTranslate();

  return (
    <Box
      component="a"
      href="#main-content"
      sx={{
        position: 'fixed',
        top: -100,
        left: 0,
        zIndex: 9999,
        p: 2,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        fontWeight: 'bold',
        textDecoration: 'none',
        transition: 'top 0.2s ease',
        '&:focus': {
          top: 0,
          outline: '2px solid',
          outlineColor: 'primary.dark',
        },
      }}
    >
      {t('skip_to_content')}
    </Box>
  );
}
