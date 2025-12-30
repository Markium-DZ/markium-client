import { Helmet } from 'react-helmet-async';
import { InventoryItemsView } from 'src/sections/inventory/view';

// ----------------------------------------------------------------------

export default function InventoryItemsPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Inventory Items</title>
      </Helmet>

      <InventoryItemsView />
    </>
  );
}
