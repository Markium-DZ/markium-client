import { _id } from 'src/_mock/assets';

// ----------------------------------------------------------------------

const MOCK_ID = _id[1];

const ROOTS = {
  AUTH: '/auth',
  AUTH_DEMO: '/auth-demo',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  comingSoon: '/coming-soon',
  maintenance: '/maintenance',
  pricing: '/pricing',
  payment: '/payment',
  paymentSuccess: '/payment-success',
  paymentFailed: '/payment-failed',
  about: '/about-us',
  contact: '/contact-us',
  faqs: '/faqs',
  page403: '/403',
  page404: '/404',
  page500: '/500',
  components: '/components',
  docs: 'https://docs.minimals.cc',
  changelog: 'https://docs.minimals.cc/changelog',
  zoneUI: 'https://mui.com/store/items/zone-landing-page/',
  minimalUI: 'https://mui.com/store/items/minimal-dashboard/',
  freeUI: 'https://mui.com/store/items/minimal-dashboard-free/',
  figma:
    'https://www.figma.com/file/hjxMnGUJCjY7pX8lQbS7kn/%5BPreview%5D-Minimal-Web.v5.4.0?type=design&node-id=0-1&mode=design&t=2fxnS70DuiTLGzND-0',
  product: {
    root: `/product`,
    checkout: `/product/checkout`,
    details: (id) => `/product/${id}`,
    demo: {
      details: `/product/${MOCK_ID}`,
    },
  },
  // AUTH
  auth: {
    amplify: {
      login: `${ROOTS.AUTH}/amplify/login`,
      verify: `${ROOTS.AUTH}/amplify/verify`,
      register: `${ROOTS.AUTH}/amplify/register`,
      newPassword: `${ROOTS.AUTH}/amplify/new-password`,
      forgotPassword: `${ROOTS.AUTH}/amplify/forgot-password`,
    },
    jwt: {
      login: `${ROOTS.AUTH}/jwt/login`,
      register: `${ROOTS.AUTH}/jwt/register`,
      verify: `${ROOTS.AUTH}/jwt/verify`,
    },
    firebase: {
      login: `${ROOTS.AUTH}/firebase/login`,
      verify: `${ROOTS.AUTH}/firebase/verify`,
      register: `${ROOTS.AUTH}/firebase/register`,
      forgotPassword: `${ROOTS.AUTH}/firebase/forgot-password`,
    },
    auth0: {
      login: `${ROOTS.AUTH}/auth0/login`,
    },
    supabase: {
      login: `${ROOTS.AUTH}/supabase/login`,
      verify: `${ROOTS.AUTH}/supabase/verify`,
      register: `${ROOTS.AUTH}/supabase/register`,
      newPassword: `${ROOTS.AUTH}/supabase/new-password`,
      forgotPassword: `${ROOTS.AUTH}/supabase/forgot-password`,
    },
  },
  authDemo: {
    classic: {
      login: `${ROOTS.AUTH_DEMO}/classic/login`,
      register: `${ROOTS.AUTH_DEMO}/classic/register`,
      forgotPassword: `${ROOTS.AUTH_DEMO}/classic/forgot-password`,
      newPassword: `${ROOTS.AUTH_DEMO}/classic/new-password`,
      verify: `${ROOTS.AUTH_DEMO}/classic/verify`,
    },
    modern: {
      login: `${ROOTS.AUTH_DEMO}/modern/login`,
      register: `${ROOTS.AUTH_DEMO}/modern/register`,
      forgotPassword: `${ROOTS.AUTH_DEMO}/modern/forgot-password`,
      newPassword: `${ROOTS.AUTH_DEMO}/modern/new-password`,
      verify: `${ROOTS.AUTH_DEMO}/modern/verify`,
    },
  },
  // ONBOARDING
  onboarding: {
    storeSetup: '/onboarding/store-setup',
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    chat: `${ROOTS.DASHBOARD}/chat`,
    blank: `${ROOTS.DASHBOARD}/blank`,
    kanban: `${ROOTS.DASHBOARD}/kanban`,
    calendar: `${ROOTS.DASHBOARD}/calendar`,
    fileManager: `${ROOTS.DASHBOARD}/file-manager`,
    permission: `${ROOTS.DASHBOARD}/permission`,
    general: {
      app: `${ROOTS.DASHBOARD}/app`,
      ecommerce: `${ROOTS.DASHBOARD}/ecommerce`,
      analytics: `${ROOTS.DASHBOARD}/analytics`,
      banking: `${ROOTS.DASHBOARD}/banking`,
      booking: `${ROOTS.DASHBOARD}/booking`,
      file: `${ROOTS.DASHBOARD}/file`,
    },
    user: {
      root: `${ROOTS.DASHBOARD}/user`,
      new: `${ROOTS.DASHBOARD}/user/new`,
      roles: `${ROOTS.DASHBOARD}/user/roles`,
      rolesNew: `${ROOTS.DASHBOARD}/user/roles/new`,
      rolesEdit: (id) => `${ROOTS.DASHBOARD}/user/roles/${id}/edit`,
      list: `${ROOTS.DASHBOARD}/user/list`,
      cards: `${ROOTS.DASHBOARD}/user/cards`,
      profile: `${ROOTS.DASHBOARD}/user/profile`,
      account: `${ROOTS.DASHBOARD}/user/account`,
      edit: (id) => `${ROOTS.DASHBOARD}/user/${id}/edit`,
      demo: {
        edit: `${ROOTS.DASHBOARD}/user/${MOCK_ID}/edit`,
      },
    },
    product: {
      root: `${ROOTS.DASHBOARD}/product`,
      new: `${ROOTS.DASHBOARD}/product/new`,
      details: (id) => `${ROOTS.DASHBOARD}/product/${id}`,
      orders: (id) => `${ROOTS.DASHBOARD}/product/${id}/orders`,
      edit: (id) => `${ROOTS.DASHBOARD}/product/${id}/edit`,
      uploadAssets: (id) => `${ROOTS.DASHBOARD}/product/${id}/upload-assets`,
      costs: (id) => `${ROOTS.DASHBOARD}/product/${id}/costs`,
      demo: {
        details: `${ROOTS.DASHBOARD}/product/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/product/${MOCK_ID}/edit`,
      },
    },
    profitability: {
      root: `${ROOTS.DASHBOARD}/profitability`,
      products: `${ROOTS.DASHBOARD}/profitability/products`,
      product: (id) => `${ROOTS.DASHBOARD}/profitability/products/${id}`,
      campaigns: `${ROOTS.DASHBOARD}/profitability/campaigns`,
      channels: `${ROOTS.DASHBOARD}/profitability/channels`,
      channel: (ch) => `${ROOTS.DASHBOARD}/profitability/channels/${ch}`,
    },

    log: {
      root: `${ROOTS.DASHBOARD}/log`,
      list: `${ROOTS.DASHBOARD}/log/list`,
    },
    settings: {
      root: `${ROOTS.DASHBOARD}/settings`,
      general: `${ROOTS.DASHBOARD}/settings/general`,
      account: `${ROOTS.DASHBOARD}/settings/account`,
      store_logo: `${ROOTS.DASHBOARD}/settings/store-logo`,
      store_data: `${ROOTS.DASHBOARD}/settings/store-data`,
      store_template: `${ROOTS.DASHBOARD}/settings/store-template`,
      yearly_payment: `${ROOTS.DASHBOARD}/settings/yearly-payment`,
      points: `${ROOTS.DASHBOARD}/settings/points`,
      marketing_pixels: `${ROOTS.DASHBOARD}/settings/marketing-pixels`,
      session_replay: `${ROOTS.DASHBOARD}/settings/session-replay`,
      delivery_companies: `${ROOTS.DASHBOARD}/settings/delivery-companies`,
      cod: `${ROOTS.DASHBOARD}/settings/cod`,
      notifications: `${ROOTS.DASHBOARD}/settings/notifications`,
      contacts_social: `${ROOTS.DASHBOARD}/settings/contacts-social`,
      color_palette: `${ROOTS.DASHBOARD}/settings/color-palette`,
      appearance: `${ROOTS.DASHBOARD}/settings/appearance`,
      store_language: `${ROOTS.DASHBOARD}/settings/store-language`,
      contact_support: `${ROOTS.DASHBOARD}/contact-support`,
      states: `${ROOTS.DASHBOARD}/settings/states`,
      statesNew: `${ROOTS.DASHBOARD}/settings/states/new`,
      statesEdit: (id)=>`${ROOTS.DASHBOARD}/settings/states/${id}/edit`,
      payment_methods: `${ROOTS.DASHBOARD}/settings/payment_methods`,
      payment_methodsNew: `${ROOTS.DASHBOARD}/settings/payment_methods/new`,
      payment_methodsEdit: (id)=>`${ROOTS.DASHBOARD}/settings/payment_methods/${id}/edit`,
      neighborhoods: `${ROOTS.DASHBOARD}/settings/neighborhood`,
      neighborhoodsNew: `${ROOTS.DASHBOARD}/settings/neighborhood/new`,
      neighborhoodsEdit: (id)=>`${ROOTS.DASHBOARD}/settings/neighborhood/${id}/edit`,
      colors: `${ROOTS.DASHBOARD}/settings/colors`,
      colorsNew: `${ROOTS.DASHBOARD}/settings/colors/new`,
      colorsEdit: (id)=>`${ROOTS.DASHBOARD}/settings/colors/${id}/edit`,
      countries: `${ROOTS.DASHBOARD}/settings/countries`,
      countriesNew: `${ROOTS.DASHBOARD}/settings/countries/new`,
      countriesEdit: (id)=>`${ROOTS.DASHBOARD}/settings/countries/${id}/edit`,
      categories: `${ROOTS.DASHBOARD}/settings/categories`,
      categoriesNew: `${ROOTS.DASHBOARD}/settings/categories/new`,
      categoriesEdit: (id)=>`${ROOTS.DASHBOARD}/settings/categories/${id}/edit`,
    },
    invoice: {
      root: `${ROOTS.DASHBOARD}/invoice`,
      new: `${ROOTS.DASHBOARD}/invoice/new`,
      details: (id) => `${ROOTS.DASHBOARD}/invoice/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/invoice/${id}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/invoice/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/invoice/${MOCK_ID}/edit`,
      },
    },
    order: {
      root: `${ROOTS.DASHBOARD}/order`,
      details: (id) => `${ROOTS.DASHBOARD}/order/${id}`,
      demo: {
        details: `${ROOTS.DASHBOARD}/order/${MOCK_ID}`,
      },
    },
    media: {
      root: `${ROOTS.DASHBOARD}/media`,
    },
    inventory: {
      root: `${ROOTS.DASHBOARD}/inventory`,
      lowStock: `${ROOTS.DASHBOARD}/inventory/low-stock`,
      details: (id) => `${ROOTS.DASHBOARD}/inventory/${id}`,
      tracking: (id) => `${ROOTS.DASHBOARD}/inventory/${id}/tracking`,
      items: (id) => `${ROOTS.DASHBOARD}/inventory/${id}/items`,
      itemTracking: (id, itemId) => `${ROOTS.DASHBOARD}/inventory/${id}/items/${itemId}/tracking`,
    },
    job: {
      root: `${ROOTS.DASHBOARD}/job`,
      new: `${ROOTS.DASHBOARD}/job/new`,
      details: (id) => `${ROOTS.DASHBOARD}/job/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/job/${id}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/job/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/job/${MOCK_ID}/edit`,
      },
    },
    tour: {
      root: `${ROOTS.DASHBOARD}/tour`,
      new: `${ROOTS.DASHBOARD}/tour/new`,
      details: (id) => `${ROOTS.DASHBOARD}/tour/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/tour/${id}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/tour/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/tour/${MOCK_ID}/edit`,
      },
    },
    apps:{
      android:"/app/app-release.apk"
    },
    subscription: {
      root: `${ROOTS.DASHBOARD}/subscription`,
      checkout: `${ROOTS.DASHBOARD}/subscription/checkout`,
      history: `${ROOTS.DASHBOARD}/subscription/history`,
    },
  },
};
