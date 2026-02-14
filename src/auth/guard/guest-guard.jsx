import PropTypes from 'prop-types';
import { useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { PATH_AFTER_LOGIN } from 'src/config-global';

import { SplashScreen } from 'src/components/loading-screen';
import { OtpVerifyModal } from 'src/sections/auth/jwt';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

export default function GuestGuard({ children }) {
  const { loading } = useAuthContext();

  return <>{loading ? <SplashScreen /> : <Container> {children}</Container>}</>;
}

GuestGuard.propTypes = {
  children: PropTypes.node,
};

// ----------------------------------------------------------------------

function Container({ children }) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const returnTo = searchParams.get('returnTo');

  const { authenticated, user } = useAuthContext();

  const check = useCallback(() => {
    if (authenticated) {
      // Phone not verified -> stay on current page, OTP modal will overlay
      if (!user?.is_phone_verified) {
        return;
      }

      // Phone verified but no store -> onboarding wizard
      if (!user?.has_store || !user?.store_setup_complete) {
        router.replace(paths.onboarding.storeSetup);
        return;
      }

      router.replace(returnTo || PATH_AFTER_LOGIN);
    }
  }, [authenticated, user, returnTo, router]);

  useEffect(() => {
    check();
  }, [check]);

  // Show OTP modal over the current page if authenticated but phone not verified
  if (authenticated && !user?.is_phone_verified) {
    return (
      <>
        {children}
        <OtpVerifyModal open />
      </>
    );
  }

  return <>{children}</>;
}

Container.propTypes = {
  children: PropTypes.node,
};
