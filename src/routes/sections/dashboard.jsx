import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { LoadingScreen } from 'src/components/loading-screen';

// Lazy-load heavy layout components to keep them out of the initial bundle
const AuthGuard = lazy(() => import('src/auth/guard').then(m => ({ default: m.AuthGuard })));
const DashboardLayout = lazy(() => import('src/layouts/dashboard'));
const PermissionsRouteContext = lazy(() => import('src/auth/context/permissions/permissions-route-context'));


// ----------------------------------------------------------------------

// OVERVIEW
const IndexPage = lazy(() => import('src/pages/dashboard/app'));
const OverviewEcommercePage = lazy(() => import('src/pages/dashboard/ecommerce'));
const OverviewAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));
const OverviewBankingPage = lazy(() => import('src/pages/dashboard/banking'));
const OverviewBookingPage = lazy(() => import('src/pages/dashboard/booking'));
const OverviewFilePage = lazy(() => import('src/pages/dashboard/file'));
// PRODUCT
const ProductDetailsPage = lazy(() => import('src/pages/dashboard/product/details'));
const ProductListPage = lazy(() => import('src/pages/dashboard/product/list'));
const ProductCreatePage = lazy(() => import('src/pages/dashboard/product/new'));
const ProductEditPage = lazy(() => import('src/pages/dashboard/product/edit'));
const ProductUploadAssetsPage = lazy(() => import('src/pages/dashboard/product/upload-assets'));
// ORDER
const ProductOrdersListPage = lazy(() => import('src/pages/dashboard/order/product-orders'));
const OrderListPage = lazy(() => import('src/pages/dashboard/order/list'));
const OrderDetailsPage = lazy(() => import('src/pages/dashboard/order/details'));
// MEDIA
const MediaListPage = lazy(() => import('src/pages/dashboard/media/list'));
// INVENTORY
const InventoryListPage = lazy(() => import('src/pages/dashboard/inventory/list'));
const LowStockInventoryPage = lazy(() => import('src/pages/dashboard/inventory/low-stock'));
const InventoryDetailsPage = lazy(() => import('src/pages/dashboard/inventory/details'));
const InventoryTrackingPage = lazy(() => import('src/pages/dashboard/inventory/tracking'));
const InventoryItemsPage = lazy(() => import('src/pages/dashboard/inventory/items'));
const ItemTrackingPage = lazy(() => import('src/pages/dashboard/inventory/item-tracking'));

// roles
const RolesListPage = lazy(() => import('src/pages/dashboard/user/roles/roles'));
const RolesCreatePage = lazy(() => import('src/pages/dashboard/user/roles/roles-new'));
const RolesEditPage = lazy(() => import('src/pages/dashboard/user/roles/roles-edit'));
// users
const UsersListPage = lazy(() => import('src/pages/dashboard/user/users/users'));

// Neighborhood system settings
const NeighborhoodListPage = lazy(() => import('src/pages/dashboard/settings/neighborhood/neighborhood'));
const NeighborhoodCreatePage = lazy(() => import('src/pages/dashboard/settings/neighborhood/neighborhood-new'));
const NeighborhoodEditPage = lazy(() => import('src/pages/dashboard/settings/neighborhood/neighborhood-edit'));
// system item  settings
const AdminSystemItemListPage = lazy(() => import('src/pages/dashboard/settings/items/items-admin'));
const SystemItemListPage = lazy(() => import('src/pages/dashboard/settings/items/items'));
const SystemItemCreatePage = lazy(() => import('src/pages/dashboard/settings/items/items-new'));
const SystemItemEditPage = lazy(() => import('src/pages/dashboard/settings/items/items-edit'));


const SettingsView = lazy(() => import('src/pages/dashboard/settings/view'));
const AccountSettingsView = lazy(() => import('src/pages/dashboard/settings/account-settings-view'));
const StoreLogoView = lazy(() => import('src/pages/dashboard/settings/store-logo-view'));
const StoreDataView = lazy(() => import('src/pages/dashboard/settings/store-data-view'));
const StoreTemplateView = lazy(() => import('src/pages/dashboard/settings/store-template-view'));
const YearlyPaymentView = lazy(() => import('src/pages/dashboard/settings/yearly-payment-view'));
const SystemPointsView = lazy(() => import('src/pages/dashboard/settings/system-points-view'));
const MarketingPixelsView = lazy(() => import('src/pages/dashboard/settings/marketing-pixels-view'));
const DeliveryCompaniesView = lazy(() => import('src/pages/dashboard/settings/delivery-companies-view'));
const ContactsSocialView = lazy(() => import('src/pages/dashboard/settings/contacts-social-view'));
const ColorPaletteView = lazy(() => import('src/pages/dashboard/settings/color-palette-view'));
const StoreLanguageView = lazy(() => import('src/pages/dashboard/settings/store-language-view'));
const GeneralSettingsView = lazy(() => import('src/pages/dashboard/settings/general-settings-view'));
const ContactSupportView = lazy(() => import('src/pages/dashboard/contact-support-view'));



// INVOICE
const InvoiceListPage = lazy(() => import('src/pages/dashboard/invoice/list'));
const InvoiceDetailsPage = lazy(() => import('src/pages/dashboard/invoice/details'));
const InvoiceCreatePage = lazy(() => import('src/pages/dashboard/invoice/new'));
const InvoiceEditPage = lazy(() => import('src/pages/dashboard/invoice/edit'));
// USER
const UserProfilePage = lazy(() => import('src/pages/dashboard/user/profile'));
const UserCardsPage = lazy(() => import('src/pages/dashboard/user/cards'));
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserAccountPage = lazy(() => import('src/pages/dashboard/user/account'));
const UserCreatePage = lazy(() => import('src/pages/dashboard/user/new'));
const UsersCreatePage = lazy(() => import('src/pages/dashboard/user/users/users-new'));
const UsersEditPage = lazy(() => import('src/pages/dashboard/user/users/users-edit'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));
// BLOG
const BlogPostsPage = lazy(() => import('src/pages/dashboard/post/list'));
const BlogPostPage = lazy(() => import('src/pages/dashboard/post/details'));
const BlogNewPostPage = lazy(() => import('src/pages/dashboard/post/new'));
const BlogEditPostPage = lazy(() => import('src/pages/dashboard/post/edit'));

// JOB
const JobDetailsPage = lazy(() => import('src/pages/dashboard/job/details'));
const JobListPage = lazy(() => import('src/pages/dashboard/job/list'));
const JobCreatePage = lazy(() => import('src/pages/dashboard/job/new'));
const JobEditPage = lazy(() => import('src/pages/dashboard/job/edit'));
// TOUR
const TourDetailsPage = lazy(() => import('src/pages/dashboard/tour/details'));
const TourListPage = lazy(() => import('src/pages/dashboard/tour/list'));
const TourCreatePage = lazy(() => import('src/pages/dashboard/tour/new'));
const TourEditPage = lazy(() => import('src/pages/dashboard/tour/edit'));
// FILE MANAGER
const FileManagerPage = lazy(() => import('src/pages/dashboard/file-manager'));
// APP
const ChatPage = lazy(() => import('src/pages/dashboard/chat'));
const MailPage = lazy(() => import('src/pages/dashboard/mail'));
const CalendarPage = lazy(() => import('src/pages/dashboard/calendar'));
const KanbanPage = lazy(() => import('src/pages/dashboard/kanban'));
// TEST RENDER PAGE BY ROLE
const PermissionDeniedPage = lazy(() => import('src/pages/dashboard/permission'));
// BLANK PAGE
const BlankPage = lazy(() => import('src/pages/dashboard/blank'));
const HomePage = lazy(() => import('src/pages/home'));

// SUBSCRIPTION
const SubscriptionCheckoutPage = lazy(() => import('src/pages/dashboard/subscription/checkout'));
const SubscriptionHistoryPage = lazy(() => import('src/pages/dashboard/subscription/history'));

// ----------------------------------------------------------------------

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <AuthGuard>
          <DashboardLayout>
            <Suspense fallback={<LoadingScreen />}>
              <Outlet />
            </Suspense>
          </DashboardLayout>
        </AuthGuard>
      </Suspense>
    ),
    children: [
      { element: <IndexPage />, index: true },
      { path: 'ecommerce', element: <OverviewEcommercePage /> },
      { path: 'analytics', element: <OverviewAnalyticsPage /> },
      { path: 'banking', element: <OverviewBankingPage /> },
      { path: 'booking', element: <OverviewBookingPage /> },
      { path: 'file', element: <OverviewFilePage /> },
      {
        path: 'user',
        children: [
          { element: <UserProfilePage />, index: true },
          { path: 'profile', element: <UserProfilePage /> },
          { path: 'cards', element: <UserCardsPage /> },
          { path: 'list', element: <PermissionsRouteContext action={"read.user"} ><UsersListPage /></PermissionsRouteContext> },
          { path: 'new', element: <PermissionsRouteContext action={"create.user"} ><UsersCreatePage /></PermissionsRouteContext>  },
          { path: ':id/edit', element: <PermissionsRouteContext action={"update.user"} ><UsersEditPage /></PermissionsRouteContext> },
          { path: 'account', element: <UserAccountPage /> },
          { path: 'roles', element: <PermissionsRouteContext action={"read.role"} ><RolesListPage /></PermissionsRouteContext> },
          { path: 'roles/new', element: <PermissionsRouteContext action={"create.role"} ><RolesCreatePage /></PermissionsRouteContext> },
          { path: 'roles/:id/edit', element:<PermissionsRouteContext action={"update.role"} ><RolesEditPage /></PermissionsRouteContext>  },
        ],
      },
      {
        path: 'product',
        children: [
          { element: <ProductListPage />, index: true },
          { path: 'list', element: <ProductListPage /> },
          { path: ':id', element: <ProductDetailsPage /> },
          { path: 'new', element: <ProductCreatePage /> },
          { path: ':id/orders', element: <ProductOrdersListPage /> },
          { path: ':id/edit', element: <ProductEditPage /> },
          { path: ':id/upload-assets', element: <ProductUploadAssetsPage /> },
        ],
      },

      {
        path: 'order',
        children: [
          { element: <OrderListPage />, index: true },
          { path: 'list', element: <OrderListPage /> },
          { path: ':id', element: <OrderDetailsPage /> },
        ],
      },
      {
        path: 'media',
        children: [
          { element: <MediaListPage />, index: true },
          { path: 'list', element: <MediaListPage /> },
        ],
      },
      {
        path: 'inventory',
        children: [
          { element: <InventoryListPage />, index: true },
          { path: 'list', element: <InventoryListPage /> },
          { path: 'low-stock', element: <LowStockInventoryPage /> },
          { path: ':id', element: <InventoryDetailsPage /> },
          { path: ':id/tracking', element: <InventoryTrackingPage /> },
          { path: ':id/items', element: <InventoryItemsPage /> },
          { path: ':id/items/:itemId/tracking', element: <ItemTrackingPage /> },
        ],
      },
      {
        path: 'settings',
        children: [
          { element: <SettingsView />, index: true },
          { path: 'general', element: <GeneralSettingsView /> },
          { path: 'account', element: <AccountSettingsView /> },
          { path: 'store-logo', element: <StoreLogoView /> },
          { path: 'store-data', element: <StoreDataView /> },
          { path: 'store-template', element: <StoreTemplateView /> },
          { path: 'yearly-payment', element: <YearlyPaymentView /> },
          { path: 'points', element: <SystemPointsView /> },
          { path: 'marketing-pixels', element: <MarketingPixelsView /> },
          { path: 'delivery-companies', element: <DeliveryCompaniesView /> },
          { path: 'contacts-social', element: <ContactsSocialView /> },
          { path: 'color-palette', element: <ColorPaletteView /> },
          { path: 'store-language', element: <StoreLanguageView /> },
          { path: ":model/admin", element: <AdminSystemItemListPage />, index: true },
          { path: "payment_methods", element: <SystemItemListPage collection={{metadata:"Payment Method",type:"payment_method"}} />, index: true },
          { path: 'payment_methods/new', element: <SystemItemCreatePage collection={{metadata:"Payment Method",type:"payment_method"}} /> },
          { path: 'payment_methods/:id/edit', element: <SystemItemEditPage collection={{metadata:"Payment Method",type:"payment_method"}} /> },
          { path: "states", element: <SystemItemListPage collection={{metadata:"States",type:"state"}} />, index: true },
          { path: 'states/new', element: <SystemItemCreatePage collection={{metadata:"States",type:"state"}} /> },
          { path: 'states/:id/edit', element: <SystemItemEditPage collection={{metadata:"States",type:"state"}} /> },
          { path: "colors", element: <SystemItemListPage collection={{metadata:"Colors",type:"color"}} />, index: true },
          { path: 'colors/new', element: <SystemItemCreatePage collection={{metadata:"Colors",type:"color"}} /> },
          { path: 'colors/:id/edit', element: <SystemItemEditPage collection={{metadata:"Colors",type:"color"}} /> },
          { path: "countries", element: <SystemItemListPage collection={{metadata:"Countries",type:"country"}} />, index: true },
          { path: 'countries/new', element: <SystemItemCreatePage collection={{metadata:"Countries",type:"country"}} /> },
          { path: 'countries/:id/edit', element: <SystemItemEditPage /> },
          { path: "neighborhood", element: <SystemItemListPage collection={{metadata:"Neighborhood",type:"neighborhood"}} />, index: true },
          { path: 'neighborhood/new', element: <SystemItemCreatePage collection={{metadata:"Neighborhood",type:"neighborhood"}} /> },
          { path: 'neighborhood/:id/edit', element: <SystemItemEditPage collection={{metadata:"Neighborhood",type:"neighborhood"}} /> },
          { path: "categories", element: <SystemItemListPage collection={{metadata:"Categories",type:"categories"}} />, index: true },
          { path: 'categories/new', element: <SystemItemCreatePage collection={{metadata:"Categories",type:"categories"}} /> },
          { path: 'categories/:id/edit', element: <SystemItemEditPage collection={{metadata:"Categories",type:"categories"}} /> },
        ],
      },

      {
        path: 'invoice',
        children: [
          { element: <InvoiceListPage />, index: true },
          { path: 'list', element: <InvoiceListPage /> },
          { path: ':id', element: <InvoiceDetailsPage /> },
          { path: ':id/edit', element: <InvoiceEditPage /> },
          { path: 'new', element: <InvoiceCreatePage /> },
        ],
      },
      {
        path: 'post',
        children: [
          { element: <BlogPostsPage />, index: true },
          { path: 'list', element: <BlogPostsPage /> },
          { path: ':title', element: <BlogPostPage /> },
          { path: ':title/edit', element: <BlogEditPostPage /> },
          { path: 'new', element: <BlogNewPostPage /> },
        ],
      },
      {
        path: 'job',
        children: [
          { element: <JobListPage />, index: true },
          { path: 'list', element: <JobListPage /> },
          { path: ':id', element: <JobDetailsPage /> },
          { path: 'new', element: <JobCreatePage /> },
          { path: ':id/edit', element: <JobEditPage /> },
        ],
      },

      {
        path: 'tour',
        children: [
          { element: <TourListPage />, index: true },
          { path: 'list', element: <TourListPage /> },
          { path: ':id', element: <TourDetailsPage /> },
          { path: 'new', element: <TourCreatePage /> },
          { path: ':id/edit', element: <TourEditPage /> },
        ],
      },
      { path: 'file-manager', element: <FileManagerPage /> },
      { path: 'mail', element: <MailPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'kanban', element: <KanbanPage /> },
      { path: 'permission', element: <PermissionDeniedPage /> },
      { path: 'blank', element: <BlankPage /> },
      { path: 'contact-support', element: <ContactSupportView /> },
      {
        path: 'subscription',
        children: [
          { element: <SubscriptionCheckoutPage />, index: true },
          { path: 'checkout', element: <SubscriptionCheckoutPage /> },
          { path: 'history', element: <SubscriptionHistoryPage /> },
        ],
      },
    ],
  },
  {
    path:'home',
    element:<Suspense fallback={<LoadingScreen />}><HomePage /></Suspense>
  }
];
