import { Helmet } from 'react-helmet-async';

import { SubscriptionBillingView } from 'src/sections/subscription/view';

// ----------------------------------------------------------------------

export default function SubscriptionBillingPage() {
  return (
    <>
      <Helmet>
        <title> Billing</title>
      </Helmet>

      <SubscriptionBillingView />
    </>
  );
}
