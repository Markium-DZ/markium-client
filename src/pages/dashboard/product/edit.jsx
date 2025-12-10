import { Helmet } from 'react-helmet-async';
import { useGetProduct } from 'src/api/product';

import { useParams } from 'src/routes/hooks';

import { ProductCreateView, ProductEditView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

export default function ProductEditPage() {
  const params = useParams();

  const { id } = params;
  const {product} = useGetProduct(id)
  console.log("product : ",product);

  return (
    <>
      <Helmet>
        <title> Dashboard: Product Edit</title>
      </Helmet>

      <ProductCreateView currentProduct={product} />
    </>
  );
}
