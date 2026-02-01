import { Helmet } from 'react-helmet-async';

import { PaymentSuccessView } from 'src/sections/payment/view';

// ----------------------------------------------------------------------

export default function PaymentSuccessPage() {
  return (
    <>
      <Helmet>
        <title> Payment Success</title>
      </Helmet>

      <PaymentSuccessView />
    </>
  );
}
