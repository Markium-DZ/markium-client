import { Helmet } from 'react-helmet-async';
import { InventoryListView } from 'src/sections/inventory/view';

// ----------------------------------------------------------------------

export default function InventoryListPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Inventory</title>
      </Helmet>

      <InventoryListView />
    </>
  );
}
