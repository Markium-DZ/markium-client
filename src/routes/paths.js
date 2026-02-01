import { paramCase } from 'src/utils/change-case';

import { _id, _postTitles } from 'src/_mock/assets';

// ----------------------------------------------------------------------

const MOCK_ID = _id[1];

const MOCK_TITLE = _postTitles[2];

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
  post: {
    root: `/post`,
    details: (title) => `/post/${paramCase(title)}`,
    demo: {
      details: `/post/${paramCase(MOCK_TITLE)}`,
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
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    mail: `${ROOTS.DASHBOARD}/mail`,
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
      demo: {
        details: `${ROOTS.DASHBOARD}/product/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/product/${MOCK_ID}/edit`,
      },
    },

    maintenance: {
      root: `${ROOTS.DASHBOARD}/maintenance`,
      notifications: `${ROOTS.DASHBOARD}/maintenance/notifications`,
      new: `${ROOTS.DASHBOARD}/maintenance/new`,
      edit: (id) => `${ROOTS.DASHBOARD}/maintenance/${id}/edit`,
      newClause: (idMaintenance) => `${ROOTS.DASHBOARD}/maintenance/${idMaintenance}/clause`,
      editClause: (idMaintenance,idClause) => `${ROOTS.DASHBOARD}/maintenance/${idMaintenance}/clause/${idClause}/edit`,
      details: (id) => `${ROOTS.DASHBOARD}/maintenance/${id}`,

      currentInMaintenance: `${ROOTS.DASHBOARD}/maintenance/current-in-maintenance`,
    },

    drivers: {
      root: `${ROOTS.DASHBOARD}/drivers`,
      alerts: `${ROOTS.DASHBOARD}/drivers/alerts`,
      new: `${ROOTS.DASHBOARD}/drivers/new`,
      details: (id) => `${ROOTS.DASHBOARD}/drivers/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/drivers/${id}/edit`,
      salary: `${ROOTS.DASHBOARD}/drivers/salary`,
    },

    documents: {
      root: `${ROOTS.DASHBOARD}/documents`,
      alerts: `${ROOTS.DASHBOARD}/documents/alerts`,
      new: `${ROOTS.DASHBOARD}/documents/new`,
      preview: `${ROOTS.DASHBOARD}/documents/preview`,
      edit: (id) => `${ROOTS.DASHBOARD}/documents/${id}/edit`,
    },
    clients: {
      root: `${ROOTS.DASHBOARD}/clients`,
      alerts: `${ROOTS.DASHBOARD}/clients/alerts`,
      claims: `${ROOTS.DASHBOARD}/clients/claims`,
      contracts: `${ROOTS.DASHBOARD}/clients/contracts`,
      newContracts: `${ROOTS.DASHBOARD}/clients/contracts/new`,
      editContracts:(id) => `${ROOTS.DASHBOARD}/clients/contracts/${id}/edit`,
      new: `${ROOTS.DASHBOARD}/clients/new`,
      edit:(id)=> `${ROOTS.DASHBOARD}/clients/${id}/edit`,
      details: (id) => `${ROOTS.DASHBOARD}/clients/${id}`,
      contractsDetails: (id) => `${ROOTS.DASHBOARD}/clients/contracts/${id}`,
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
      delivery_companies: `${ROOTS.DASHBOARD}/settings/delivery-companies`,
      contacts_social: `${ROOTS.DASHBOARD}/settings/contacts-social`,
      color_palette: `${ROOTS.DASHBOARD}/settings/color-palette`,
      store_language: `${ROOTS.DASHBOARD}/settings/store-language`,
      contact_support: `${ROOTS.DASHBOARD}/contact-support`,
      pm: `${ROOTS.DASHBOARD}/settings/pm`,
      new: `${ROOTS.DASHBOARD}/settings/pm/new`,
      edit: (id)=>`${ROOTS.DASHBOARD}/settings/pm/${id}/edit`,
      states: `${ROOTS.DASHBOARD}/settings/states`,
      statesNew: `${ROOTS.DASHBOARD}/settings/states/new`,
      statesEdit: (id)=>`${ROOTS.DASHBOARD}/settings/states/${id}/edit`,
      attachment_names: `${ROOTS.DASHBOARD}/settings/attachment_names`,
      attachment_namesNew: `${ROOTS.DASHBOARD}/settings/attachment_names/new`,
      attachment_namesEdit: (id)=>`${ROOTS.DASHBOARD}/settings/attachment_names/${id}/edit`,
      payment_methods: `${ROOTS.DASHBOARD}/settings/payment_methods`,
      payment_methodsNew: `${ROOTS.DASHBOARD}/settings/payment_methods/new`,
      payment_methodsEdit: (id)=>`${ROOTS.DASHBOARD}/settings/payment_methods/${id}/edit`,
      license_types: `${ROOTS.DASHBOARD}/settings/license_types`,
      license_typesNew: `${ROOTS.DASHBOARD}/settings/license_types/new`,
      license_typesEdit: (id)=>`${ROOTS.DASHBOARD}/settings/license_types/${id}/edit`,
      documents: `${ROOTS.DASHBOARD}/settings/documents`,
      documentsNew: `${ROOTS.DASHBOARD}/settings/documents/new`,
      documentsEdit: (id)=>`${ROOTS.DASHBOARD}/settings/documents/${id}/edit`,
      neighborhoods: `${ROOTS.DASHBOARD}/settings/neighborhood`,
      neighborhoodsNew: `${ROOTS.DASHBOARD}/settings/neighborhood/new`,
      neighborhoodsEdit: (id)=>`${ROOTS.DASHBOARD}/settings/neighborhood/${id}/edit`,
      colors: `${ROOTS.DASHBOARD}/settings/colors`,
      colorsNew: `${ROOTS.DASHBOARD}/settings/colors/new`,
      colorsEdit: (id)=>`${ROOTS.DASHBOARD}/settings/colors/${id}/edit`,
      countries: `${ROOTS.DASHBOARD}/settings/countries`,
      countriesNew: `${ROOTS.DASHBOARD}/settings/countries/new`,
      countriesEdit: (id)=>`${ROOTS.DASHBOARD}/settings/countries/${id}/edit`,
      car_models: `${ROOTS.DASHBOARD}/settings/car_models`,
      car_modelsNew: `${ROOTS.DASHBOARD}/settings/car_models/new`,
      car_modelsEdit: (id)=>`${ROOTS.DASHBOARD}/settings/car_models/${id}/edit`,
      car_companies: `${ROOTS.DASHBOARD}/settings/car_companies`,
      car_companiesNew: `${ROOTS.DASHBOARD}/settings/car_companies/new`,
      car_companiesEdit: (id)=>`${ROOTS.DASHBOARD}/settings/car_companies/${id}/edit`,
      specs: `${ROOTS.DASHBOARD}/settings/specs`,
      specsNew: `${ROOTS.DASHBOARD}/settings/specs/new`,
      specsEdit: (id)=>`${ROOTS.DASHBOARD}/settings/specs/${id}/edit`,
      categories: `${ROOTS.DASHBOARD}/settings/categories`,
      categoriesNew: `${ROOTS.DASHBOARD}/settings/categories/new`,
      categoriesEdit: (id)=>`${ROOTS.DASHBOARD}/settings/categories/${id}/edit`,
    },
    vehicle: {
      root: `${ROOTS.DASHBOARD}/vehicle`,
      new: `${ROOTS.DASHBOARD}/vehicle/new`,
      log: `${ROOTS.DASHBOARD}/vehicle/log`,
      details: (id) => `${ROOTS.DASHBOARD}/vehicle/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/vehicle/${id}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/vehicle/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/vehicle/${MOCK_ID}/edit`,
      },
      inputs: `${ROOTS.DASHBOARD}/vehicle/inputs`,
      pm: (id) => `${ROOTS.DASHBOARD}/vehicle/${id}/pm`,
      addpm: (id) => `${ROOTS.DASHBOARD}/vehicle/${id}/pm/new`,
    },

    company: {
      root: `${ROOTS.DASHBOARD}/company`,
      new: `${ROOTS.DASHBOARD}/company/new`,
      log: `${ROOTS.DASHBOARD}/company/log`,
      details: (id) => `${ROOTS.DASHBOARD}/company/${id}`,
      edit: (id) => `${ROOTS.DASHBOARD}/company/${id}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/company/${MOCK_ID}`,
        edit: `${ROOTS.DASHBOARD}/company/${MOCK_ID}/edit`,
      },
      inputs: `${ROOTS.DASHBOARD}/company/inputs`,
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
    post: {
      root: `${ROOTS.DASHBOARD}/post`,
      new: `${ROOTS.DASHBOARD}/post/new`,
      details: (title) => `${ROOTS.DASHBOARD}/post/${paramCase(title)}`,
      edit: (title) => `${ROOTS.DASHBOARD}/post/${paramCase(title)}/edit`,
      demo: {
        details: `${ROOTS.DASHBOARD}/post/${paramCase(MOCK_TITLE)}`,
        edit: `${ROOTS.DASHBOARD}/post/${paramCase(MOCK_TITLE)}/edit`,
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
    }
  },
};
