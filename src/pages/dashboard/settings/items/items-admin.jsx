import { Helmet } from 'react-helmet-async';
import { useParams } from 'src/routes/hooks';
import AdminSystemItemListView from 'src/sections/settings/SystemItem/AdminSystemItemListView';
import SystemItemListView from 'src/sections/settings/SystemItem/SystemItemListView';
// ----------------------------------------------------------------------

export default function AdminSystemSettingsListPage({ }) {
  const types = [
    { key: "payment_method", model: "payment_methods" },
    { key: "state", model: "states" },
    { key: "color", model: "colors" },
    { key: "country", model: "countries" },
    { key: "neighborhood", model: "neighborhood" },
  ]
  const params = useParams();
  const { model } = params;
  return (
    <>
      <Helmet>
        <title> Settings {model} Page</title>
      </Helmet>

      <AdminSystemItemListView collection={{ metadata: model, type: types.find(i => i.model == model)?.key }} />
    </>
  );
}
