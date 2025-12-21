import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';

import { RoleBasedGuard } from 'src/auth/guard';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { t } from 'i18next';
import { Divider, Link } from '@mui/material';
import Iconify from 'src/components/iconify';
import PermissionsContext from 'src/auth/context/permissions/permissions-context';

// ----------------------------------------------------------------------

export default function SettingsView() {
  const settings = useSettingsContext();

  const [role, setRole] = useState('admin');

  const groups = [
    // {
    //   title: "account_settings",
    //   icon: "solar:user-bold-duotone",
    //   items: [
    //     { type: "account", header: "account_details", subheader: "manage_your_account_information", href: paths?.dashboard.settings.account },
    //   ]
    // },
    {
      title: "store_settings",
      icon: "solar:shop-bold-duotone",
      items: [
        { type: "store_logo", header: "store_logo", subheader: "upload_and_update_store_logo", href: paths?.dashboard.settings.store_logo },
        // { type: "store_data", header: "store_data", subheader: "manage_store_information", href: paths?.dashboard.settings.store_data },
        { type: "store_template", header: "store_template", subheader: "choose_and_update_store_theme", href: paths?.dashboard.settings.store_template },
        { type: "store_language", header: "store_language", subheader: "set_default_store_language", href: paths?.dashboard.settings.store_language },
        { type: "color_palette", header: "color_palette", subheader: "customize_color_scheme_and_branding", href: paths?.dashboard.settings.color_palette },
        { type: "add-categories", header: "categories", subheader: "manage_product_categories", href: paths?.dashboard.settings.categories },

      ]
    },
    // {
    //   title: "payment_settings",
    //   icon: "solar:card-bold-duotone",
    //   items: [
    //     { type: "yearly_payment", header: "yearly_payment", subheader: "manage_yearly_subscription_payment", href: paths?.dashboard.settings.yearly_payment },
    //     { type: "points_settings", header: "points_settings", subheader: "configure_points_and_rewards_system", href: paths?.dashboard.settings.points },
    //   ]
    // },
    {
      title: "marketing_settings",
      icon: "solar:chart-2-bold-duotone",
      items: [
        { type: "marketing_pixels", header: "social_media_pixels", subheader: "configure_tracking_pixels_and_analytics", href: paths?.dashboard.settings.marketing_pixels },
        { type: "contacts_social", header: "contacts_social_media", subheader: "manage_contact_info_and_social_links", href: paths?.dashboard.settings.contacts_social },

      ]
    },
    {
      title: "delivery_settings",
      icon: "solar:box-bold-duotone",
      items: [
        { type: "delivery_companies", header: "delivery_companies", subheader: "configure_delivery_companies_integration", href: paths?.dashboard.settings.delivery_companies },
      ]
    },
    // {
    //   title: "appearance_settings",
    //   icon: "solar:palette-bold-duotone",
    //   items: [
    //     { type: "color_palette", header: "color_palette", subheader: "customize_color_scheme_and_branding", href: paths?.dashboard.settings.color_palette },
    //   ]
    // },
  ]


  const handleChangeRole = useCallback((event, newRole) => {
    if (newRole !== null) {
      setRole(newRole);
    }
  }, []);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading={t("system_settings")}
        links={[
          {
            name: t('dashboard'),
            href: paths.dashboard.root,
          },
          {
            name: t("system_settings"),
          },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <RoleBasedGuard hasContent roles={[role]} sx={{ py: 10 }}>
        {
          groups?.map((group, index) => (
            <>
              {index > 0 && <Divider orientation="horizontal" sx={{ mt: 4, display: 'flex' }} />}
              <Typography variant="h4" sx={{ mb: 2, mt: 2, display: "flex", alignItems: "center" }} >
                <Iconify icon={group?.icon} width="40px" height="40px" sx={{ mx: 1, color: 'primary.main' }} />
                {t(group?.title)}
              </Typography>
              {/* <Box gap={3} display="grid" gridTemplateColumns="repeat(3, 1fr)"> */}
              <Box
                rowGap={3}
                columnGap={2}
                display="grid"
                gridTemplateColumns={{
                  xs: 'repeat(1, 1fr)',
                  sm: 'repeat(3, 1fr)',
                }}
              >
                {
                  group.items?.map((item, index2) => (
                    <Link href={item?.href} underline='none'>
                      <Card key={index2} sx={{ pb: 2 }}>
                        <CardHeader title={t(item?.header)} subheader={<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>{t(item?.subheader)}<Link href={item?.href} sx={{ fontSize: "0.7rem" }}><Iconify icon="tabler:arrow-narrow-left" width="32px" height="32px" sx={{ color: 'primary.main' }} /></Link></Box>} />
                      </Card>
                    </Link>
                  ))
                }
              </Box>
            </>
          ))
        }

      </RoleBasedGuard>
    </Container>
  );
}
