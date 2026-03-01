import { Helmet } from 'react-helmet-async';
import ProfitabilityProductsView from 'src/sections/profitability/view/profitability-products-view';

export default function ProfitabilityProductsPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Products P&L</title>
      </Helmet>
      <ProfitabilityProductsView />
    </>
  );
}
