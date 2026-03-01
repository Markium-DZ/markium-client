import { Helmet } from 'react-helmet-async';
import ProfitabilityChannelsView from 'src/sections/profitability/view/profitability-channels-view';

export default function ProfitabilityChannelsPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Channels Overview</title>
      </Helmet>
      <ProfitabilityChannelsView />
    </>
  );
}
