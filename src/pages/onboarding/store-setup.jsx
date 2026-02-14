import { Helmet } from 'react-helmet-async';

import StoreSetupWizardView from 'src/sections/onboarding/store-setup-wizard-view';

// ----------------------------------------------------------------------

export default function StoreSetupPage() {
  return (
    <>
      <Helmet>
        <title> Markium: Store Setup</title>
      </Helmet>

      <StoreSetupWizardView />
    </>
  );
}
