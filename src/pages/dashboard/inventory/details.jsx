import { Helmet } from 'react-helmet-async';
import { InventoryDetailsView } from 'src/sections/inventory/view';

// ----------------------------------------------------------------------

export default function InventoryDetailsPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Inventory Details</title>
      </Helmet>

      <InventoryDetailsView />
    </>
  );
}
