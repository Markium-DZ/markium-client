import { Helmet } from 'react-helmet-async';
import { LowStockInventoryView } from 'src/sections/inventory/view';

// ----------------------------------------------------------------------

export default function LowStockInventoryPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Low Stock Inventory</title>
      </Helmet>

      <LowStockInventoryView />
    </>
  );
}
