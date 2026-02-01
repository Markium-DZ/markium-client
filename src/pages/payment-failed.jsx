import { Helmet } from 'react-helmet-async';

import { PaymentFailedView } from 'src/sections/payment/view';

// ----------------------------------------------------------------------

export default function PaymentFailedPage() {
  return (
    <>
      <Helmet>
        <title> Payment Failed</title>
      </Helmet>

      <PaymentFailedView />
    </>
  );
}
