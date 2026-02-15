import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { PATH_AFTER_LOGIN } from 'src/config-global';

import { SplashScreen } from 'src/components/loading-screen';
import { OtpVerifyModal } from 'src/sections/auth/jwt';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

export default function PhoneVerifiedGuard({ children }) {
  const { loading } = useAuthContext();

  return <>{loading ? <SplashScreen /> : <Container>{children}</Container>}</>;
}

PhoneVerifiedGuard.propTypes = {
  children: PropTypes.node,
};

// ----------------------------------------------------------------------

function Container({ children }) {
  const router = useRouter();

  const { authenticated, user, logout } = useAuthContext();

  const [checked, setChecked] = useState(false);

  const check = useCallback(() => {
    if (!authenticated) {
      const returnTo = window.location.pathname + window.location.search;
      const searchParams = new URLSearchParams({ returnTo }).toString();
      router.replace(`${paths.auth.jwt.login}?${searchParams}`);
      return;
    }

    // Phone not verified -> show OTP modal (handled in render)
    if (!user?.is_phone_verified) {
      setChecked(true);
      return;
    }

    // If already fully set up, go to dashboard
    if (user?.has_store && user?.store_setup_complete) {
      router.replace(PATH_AFTER_LOGIN);
      return;
    }

    setChecked(true);
  }, [authenticated, user, router]);

  const handleOtpClose = useCallback(async () => {
    await logout();
    router.replace(paths.auth.jwt.login);
  }, [logout, router]);

  useEffect(() => {
    check();
  }, [check]);

  if (!checked) {
    return null;
  }

  // Show OTP modal if phone not verified
  if (authenticated && !user?.is_phone_verified) {
    return <OtpVerifyModal open onClose={handleOtpClose} />;
  }

  return <>{children}</>;
}

Container.propTypes = {
  children: PropTypes.node,
};
