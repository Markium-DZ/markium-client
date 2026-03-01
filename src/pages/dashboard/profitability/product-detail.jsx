import { Helmet } from 'react-helmet-async';
import { useParams } from 'src/routes/hooks';
import ProfitabilityProductView from 'src/sections/profitability/view/profitability-product-view';

export default function ProfitabilityProductDetailPage() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title>Dashboard: Product P&L</title>
      </Helmet>
      <ProfitabilityProductView id={id} />
    </>
  );
}
