import { Helmet } from 'react-helmet-async';

import { OverviewEcommerceView } from 'src/sections/overview/e-commerce/view';

// ----------------------------------------------------------------------

export default function OverviewAppPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Markium</title>
      </Helmet>
      <OverviewEcommerceView />
    </>
  );
}
