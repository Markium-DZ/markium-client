import { Helmet } from 'react-helmet-async';
import ProfitabilityOverviewView from 'src/sections/profitability/view/profitability-overview-view';

export default function ProfitabilityOverviewPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard: Profitability Overview</title>
      </Helmet>
      <ProfitabilityOverviewView />
    </>
  );
}
