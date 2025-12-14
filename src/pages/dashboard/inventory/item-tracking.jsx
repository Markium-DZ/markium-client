import { Helmet } from 'react-helmet-async';
import { ItemTrackingView } from 'src/sections/inventory/view';

// ----------------------------------------------------------------------

export default function ItemTrackingPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Item Tracking</title>
      </Helmet>

      <ItemTrackingView />
    </>
  );
}
