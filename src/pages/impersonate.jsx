import { Helmet } from 'react-helmet-async';

import { ImpersonateView } from 'src/sections/auth/impersonate';

// ----------------------------------------------------------------------

export default function ImpersonatePage() {
  return (
    <>
      <Helmet>
        <title> Markium: Impersonation</title>
      </Helmet>

      <ImpersonateView />
    </>
  );
}
