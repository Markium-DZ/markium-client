import PropTypes from 'prop-types';
import { useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { PATH_AFTER_LOGIN } from 'src/config-global';

import { SplashScreen } from 'src/components/loading-screen';

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
      // No store -> onboarding wizard (works for both verified and unverified users)
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

  return <>{children}</>;
}

Container.propTypes = {
  children: PropTypes.node,
};
