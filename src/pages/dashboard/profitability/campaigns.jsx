import { Helmet } from 'react-helmet-async';
import ProfitabilityCampaignsView from 'src/sections/profitability/view/profitability-campaigns-view';

export default function ProfitabilityCampaignsPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Campaigns ROI</title>
      </Helmet>
      <ProfitabilityCampaignsView />
    </>
  );
}
