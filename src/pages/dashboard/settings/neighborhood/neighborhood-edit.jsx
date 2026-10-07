import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router';
import NeighborhoodCreateView from 'src/sections/settings/SystemNeighborhoods/NeighborhoodCreateView';

// ----------------------------------------------------------------------

export default function NeighborhoodEditPage() {
   const params = useParams();
  
    const { id } = params;
  
  return (
    <>
      <Helmet>
        <title> System: Edit a Neighborhood</title>
      </Helmet>

      <NeighborhoodCreateView id={id} />
    </>
  );
}
