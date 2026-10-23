import GeneralSettingsForm from 'src/sections/settings/general-settings-form';
import MarketplaceVisibilityForm from 'src/sections/settings/marketplace-visibility-form';

// ----------------------------------------------------------------------

export default function GeneralSettingsView() {
  return (
    <>
      <GeneralSettingsForm />

      <MarketplaceVisibilityForm />
    </>
  );
}
