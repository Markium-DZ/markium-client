import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';

import { useParams } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { CHANNEL_ICONS } from 'src/sections/profitability/constants';
import ProfitabilityChannelView from 'src/sections/profitability/view/profitability-channel-view';

const VALID_CHANNELS = Object.keys(CHANNEL_ICONS);

export default function ProfitabilityChannelDetailPage() {
  const { channel } = useParams();

  if (!VALID_CHANNELS.includes(channel)) {
    return <Navigate to={paths.dashboard.profitability.channels} replace />;
  }

  return (
    <>
      <Helmet>
        <title>Dashboard: Channel Detail</title>
      </Helmet>
      <ProfitabilityChannelView channel={channel} />
    </>
  );
}
