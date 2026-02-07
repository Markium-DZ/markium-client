import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
  // OR
  // <Iconify icon="fluent:mail-24-filled" />
  // https://icon-sets.iconify.design/solar/
  // https://www.streamlinehq.com/icons
);

const ICONS = {
  job: icon('ic_job'),
  blog: icon('ic_blog'),
  chat: icon('ic_chat'),
  mail: icon('ic_mail'),
  user: icon('ic_user'),
  file: icon('ic_file'),
  lock: icon('ic_lock'),
  tour: icon('ic_tour'),
  order: icon('ic_order'),
  label: icon('ic_label'),
  blank: icon('ic_blank'),
  kanban: icon('ic_kanban'),
  folder: icon('ic_folder'),
  banking: icon('ic_banking'),
  booking: icon('ic_booking'),
  invoice: icon('ic_invoice'),
  product: icon('ic_product'),
  calendar: icon('ic_calendar'),
  disabled: icon('ic_disabled'),
  external: icon('ic_external'),
  menuItem: icon('ic_menu_item'),
  ecommerce: icon('ic_ecommerce'),
  analytics: icon('ic_analytics'),
  settings: icon('ic_settings'),
  dashboard: icon('ic_dashboard'),
  support: <Iconify icon="solar:chat-round-call-bold-duotone" />,
  media: <Iconify icon="solar:gallery-bold" />,
  inventory: <Iconify icon="solar:box-bold" />,
  subscription: <Iconify icon="solar:wallet-bold-duotone" />,
};

// ----------------------------------------------------------------------

export function useNavData() {
  const { t } = useTranslate();

  const data = useMemo(
    () => [
      // OVERVIEW
      // ----------------------------------------------------------------------
      {
        subheader: t('overview'),
        items: [
          {
            title: t('statistics'),
            path: paths.dashboard.root,
            icon: ICONS.analytics,
          },
        ],
      },

      // MANAGEMENT
      // ----------------------------------------------------------------------
      {
        subheader: t('management'),
        items: [
          {
            title: t('products'),
            path: paths.dashboard.product.root,
            icon: ICONS.product,
            children: [
              // { title: t('alerts'), path: paths.dashboard.product.root },
              // { title: t('details'), path: paths.dashboard.product.demo.details, },
              { title: t('list'), path: paths.dashboard.product.root },
              { title: t('create'), path: paths.dashboard.product.new },
            ],
          },
          {
            title: t('orders'),
            path: paths.dashboard.order.root,
            icon: ICONS.order,
            children: [
              // { title: t('alerts'), path: paths.dashboard.order.root },
              // {title: t('details'),path: paths.dashboard.product.demo.details,},
              // { title: t('create'), path: paths.dashboard.product.new },
              { title: t('list'), path: paths.dashboard.order.root },
            ],
          },
          {
            title: t('inventory'),
            path: paths.dashboard.inventory.root,
            icon: ICONS.inventory,
            children: [
              { title: t('list'), path: paths.dashboard.inventory.root },
              { title: t('low_stock'), path: paths.dashboard.inventory.lowStock },
            ],
          },
          {
            title: t('media'),
            path: paths.dashboard.media.root,
            icon: ICONS.media,
          },


        ],
      },

      // DEMO MENU STATES
      {
        subheader: t('other_cases'),
        items: [
          {
            title: t('settings'),
            path: paths.dashboard.settings.root,
            icon: ICONS.settings,
            permissions: ["read.color", "read.country", "read.neighborhood", "read.state"],
            roles: ['admin', 'manager'],
            // permissions:"read.system_settings",
          },
          {
            title: t('subscription'),
            path: paths.dashboard.subscription.root,
            icon: ICONS.subscription,
            children: [
              { title: t('checkout'), path: paths.dashboard.subscription.checkout },
              { title: t('payment_history'), path: paths.dashboard.subscription.history },
            ],
          },
          {
            title: t('contact_support'),
            path: paths.dashboard.settings.contact_support,
            icon: ICONS.support,
          },
          // {
          //   title: t('users'),
          //   path: paths.dashboard.user.list,
          //   icon: ICONS.lock,
          //   roles: ['admin', 'manager'],
          //   permissions: ["read.user"],
          //   children: [
          //     { title: t('users'), permissions: "read.user", path: paths.dashboard.user.list },
          //     { title: t('roles'), permissions: "read.role", path: paths.dashboard.user.roles },
          //   ],
          // },
        ],
      },
    ],
    [t]
  );

  return data;
}
