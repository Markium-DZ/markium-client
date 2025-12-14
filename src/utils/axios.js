import axios from 'axios';
import { root } from 'postcss';

import { HOST_API } from 'src/config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: HOST_API });
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    // Check for 401 status and redirect to login
    if (error.response?.status === 401) {
      // Clear session data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('zaity-user-info');

      // Redirect to login
      window.location.href = '/auth/jwt/login';
    }

    // Throw the error with consistent structure
    const errorData = error.response?.data || { message: 'Something went wrong' };
    return Promise.reject(errorData);
  }
);

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const settings = localStorage.getItem('settings');
    if (settings !== null) {
      const getLang = JSON.parse(settings);
      config.headers['Accept-Language'] = getLang?.themeDirection === 'rtl' ? 'ar-AR' : 'en-US';
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await axiosInstance.get(url, { ...config });
  return res.data;
};

// ----------------------------------------------------------------------


export const api_version = "v1"


export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: `/auth/me`,
    login: `/auth/login`,
    register: `/auth/signup`,
    changePassword: `/auth/changePassword`,
    changePasswordByAdmin: `/auth/changePasswordByAdmin`,
  },
  clauses: {
    root: `/maintenance/clauses`,
    list: (id) => `/maintenance/${id}/clauses`,
    add: `/maintenance/clauses`,
    edit: (id) => `/maintenance/clauses/${id}`,

  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    root: '/products',
    list: '/product/list',
    details:(id)=> `/product/${id}`,
    update:(id)=> `/products/${id}/update`,
    assets:(id)=> `/products/${id}/assets`,
    deploy:(id)=> `/products/${id}/deploy`,
    orders:(id)=> `/products/${id}/orders`,
    updateOrdersStatus:(product_id,order_id)=> `/products/${product_id}/orders/${order_id}/status`,
    search: '/product/search',
  },
  order: {
    root: '/orders',
  },
  utils: { values: '/values' },
  media: { root: '/media' },
  inventory: {
    root: '/inventory',
    lowStock: '/inventory/low-stock',
    tracking: (id) => `/inventory/${id}/tracking`,
    transactions: (id) => `/inventory/${id}/transactions`,
    items: (id) => `/inventory/${id}/items`,
    itemTracking: (inventoryId, itemId) => `/inventory/${inventoryId}/items/${itemId}/tracking`,
  },
  company: {
    list: '/company',
    statistics: "/company/statistics"
  },
  maintenance: {
    list: '/maintenance',
    specs: "/maintenance/specifications",
    complete: (id) => `/maintenance/${id}/complete`,
    updateExitDate: (id) => `/maintenance/${id}/updateExitDate`,
    release: (id) => `/maintenance/${id}/car_release`,
    logs: "/maintenance/logs",
  },
  cars: {
    list: '/car',
    transactions: '/car/transactions',
    logs: '/car/logs',
    attach: '/car/driver/attach',
    detach: '/car/driver/detach',
    under_maintainance: '/car/under_maintainance',
    pm: (id) => `/car/${id}/maintenance/periodic`,
  },
  clients: {
    list: '/client',
    client: (id) => `/client/` + id
  },
  contracts: {
    list: '/contract',
    claims: (id) => `/contract/${id}/claims`,
    clauses: (id) => `/contract/${id}/clauses`,
    cancleClause: (id) => `/contract/clauses/${id}/cancel`,
    allclaims: `/contract/claims/all`,
    logs: "/contract/claims/logs",
    allClaims:{
      root:"/contract/claims"
    },
    clause:{
      root:"/contract/clauses",
      replace:(id) => `/contract/clauses/${id}/replace`,
    }
  },
  claims: {
    list: '/contract/1/claims',
    new: "/contract/claims",
    logs: "/contract/claims/logs",
    edit: (id) => `/contract/claims/${id}`,
    paid: (id) => `/contract/claims/${id}/paid`,
  },
  settings: {
    items: (slug)=>`/${slug}`,
    categories: '/categories',
    visibility: '/system-settings/visibility',
    mainspecs: '/maintenance/specifications',
    new: "/contract/claims",
    logs: "/contract/claims/logs"
  },
  users: {
    root: '/auth/registerCompanyEmployeer',
    users: '/users',
    roles: '/roles',
    deleteRole: (id) => `/roles/${id}/delete`,
    banUser : (id)=> `users/${id}/ban`,
    activateUser : (id)=> `users/${id}/activate`,
    permissions: '/permissions',
    user_permissions: '/auth/permissions',
    visibility: '/system-settings/visibility',
    mainspecs: '/maintenance/specifications',
    new: "/contract/claims",
    logs: "/contract/claims/logs"
  },
  documents: {
    list: '/attachments',
  },
  statistics: {
    root: '/attachments',
  },

  drivers: {
    list: '/driver',
  },
  store: {
    logo: '/store/logo',
    root: '/store',
    slug: (slug)=>`/stores/${slug}`,
  },
};
