import { Helmet } from 'react-helmet-async';
import { useParams } from 'src/routes/hooks';
import ProfitabilityChannelView from 'src/sections/profitability/view/profitability-channel-view';

export default function ProfitabilityChannelDetailPage() {
  const { channel } = useParams();

  return (
    <>
      <Helmet>
        <title>Dashboard: Channel Detail</title>
      </Helmet>
      <ProfitabilityChannelView channel={channel} />
    </>
  );
}
