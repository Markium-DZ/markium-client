import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const IMPERSONATING_KEY = 'impersonating';
const IMPERSONATING_NAME_KEY = 'impersonating_merchant';

// ----------------------------------------------------------------------

export default function ImpersonationBanner() {
  const { t } = useTranslation();
  const { logout } = useAuthContext();

  const [isImpersonating, setIsImpersonating] = useState(
    () => sessionStorage.getItem(IMPERSONATING_KEY) === '1'
  );
  const [merchantName] = useState(() => sessionStorage.getItem(IMPERSONATING_NAME_KEY) || '');

  const handleExit = useCallback(async () => {
    sessionStorage.removeItem(IMPERSONATING_KEY);
    sessionStorage.removeItem(IMPERSONATING_NAME_KEY);
    setIsImpersonating(false);

    await logout();

    window.location.href = paths.auth.jwt.login;
  }, [logout]);

  if (!isImpersonating) {
    return null;
  }

  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: (theme) => theme.zIndex.appBar + 1 }}>
      <Alert
        severity="warning"
        variant="filled"
        square
        action={
          <Button color="inherit" size="small" variant="outlined" onClick={handleExit} sx={{ borderColor: 'currentColor' }}>
            {t('exit_impersonation')}
          </Button>
        }
        sx={{ borderRadius: 0, alignItems: 'center', justifyContent: 'center' }}
      >
        {merchantName ? t('impersonation_banner_named', { name: merchantName }) : t('impersonation_banner')}
      </Alert>
    </Box>
  );
}
