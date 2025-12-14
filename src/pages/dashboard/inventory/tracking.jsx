import { Helmet } from 'react-helmet-async';
import { InventoryTrackingView } from 'src/sections/inventory/view';

// ----------------------------------------------------------------------

export default function InventoryTrackingPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Inventory Tracking</title>
      </Helmet>

      <InventoryTrackingView />
    </>
  );
}
