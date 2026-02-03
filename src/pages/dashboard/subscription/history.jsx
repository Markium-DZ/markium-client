import { Helmet } from 'react-helmet-async';

import { SubscriptionHistoryView } from 'src/sections/subscription/view';

// ----------------------------------------------------------------------

export default function SubscriptionHistoryPage() {
  return (
    <>
      <Helmet>
        <title> Payment History</title>
      </Helmet>

      <SubscriptionHistoryView />
    </>
  );
}
