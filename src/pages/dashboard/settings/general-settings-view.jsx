import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import GeneralSettingsForm from 'src/sections/settings/general-settings-form';


// ----------------------------------------------------------------------

export default function GeneralSettingsView() {
  const settings = useSettingsContext();
  const { t } = useTranslate();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading={t('general_settings')}
        links={[
          {
            name: t('dashboard'),
            href: paths.dashboard.root,
          },
          {
            name: t('settings'),
            href: paths.dashboard.settings.root,
          },
          {
            name: t('general_settings'),
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <GeneralSettingsForm />
    </Container>
  );
}
