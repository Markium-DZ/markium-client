import { Helmet } from 'react-helmet-async';

import { MediaListView } from 'src/sections/media/view';

// ----------------------------------------------------------------------

export default function MediaListPage() {
  return (
    <>
      <Helmet>
        <title>Media & Files</title>
      </Helmet>

      <MediaListView />
    </>
  );
}
