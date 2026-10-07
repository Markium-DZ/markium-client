import { Helmet } from 'react-helmet-async';

import { SubscriptionCheckoutView } from 'src/sections/subscription/view';

// ----------------------------------------------------------------------

export default function SubscriptionCheckoutPage() {
  return (
    <>
      <Helmet>
        <title> Subscription Checkout</title>
      </Helmet>

      <SubscriptionCheckoutView />
    </>
  );
}
