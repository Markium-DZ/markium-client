import { Helmet } from 'react-helmet-async';
import NeighborhoodCreateView from 'src/sections/settings/SystemNeighborhoods/NeighborhoodCreateView';

// ----------------------------------------------------------------------

export default function NeighborhoodCreatePage() {
  return (
    <>
      <Helmet>
        <title> System: Neighborhood Page</title>
      </Helmet>
      <NeighborhoodCreateView />
    </>
  );
}
