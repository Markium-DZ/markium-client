import PropTypes from 'prop-types';
import { useState, useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { SplashScreen } from 'src/components/loading-screen';
import { OtpVerifyModal } from 'src/sections/auth/jwt';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

const loginPaths = {
  jwt: paths.auth.jwt.login,
  auth0: paths.auth.auth0.login,
  amplify: paths.auth.amplify.login,
  firebase: paths.auth.firebase.login,
  supabase: paths.auth.supabase.login,
};

// ----------------------------------------------------------------------

export default function AuthGuard({ children }) {
  const { loading } = useAuthContext();

  return <>{loading ? <SplashScreen /> : <Container> {children}</Container>}</>;
}

AuthGuard.propTypes = {
  children: PropTypes.node,
};

// ----------------------------------------------------------------------

function Container({ children }) {
  const router = useRouter();

  const { authenticated, method, user, logout } = useAuthContext();

  const [checked, setChecked] = useState(false);

  const check = useCallback(() => {
    if (!authenticated) {
      const returnTo = window.location.pathname + window.location.search;
      const searchParams = new URLSearchParams({ returnTo }).toString();
      const loginPath = loginPaths[method];
      const href = `${loginPath}?${searchParams}`;
      router.replace(href);
      return;
    }

    // Phone not verified -> show OTP modal (handled in render)
    if (!user?.is_phone_verified) {
      setChecked(true);
      return;
    }

    // Store not set up -> onboarding wizard
    if (!user?.has_store || !user?.store_setup_complete) {
      router.replace(paths.onboarding.storeSetup);
      return;
    }

    setChecked(true);
  }, [authenticated, method, user, router]);

  const handleOtpClose = useCallback(async () => {
    await logout();
    router.replace(loginPaths[method]);
  }, [logout, router, method]);

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
