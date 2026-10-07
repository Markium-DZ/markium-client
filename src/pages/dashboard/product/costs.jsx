import { Helmet } from 'react-helmet-async';
import { useParams } from 'src/routes/hooks';
import ProductCostsView from 'src/sections/product-costs/view/product-costs-view';

export default function ProductCostsPage() {
  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title>Dashboard: Product Costs</title>
      </Helmet>
      <ProductCostsView id={id} />
    </>
  );
}
