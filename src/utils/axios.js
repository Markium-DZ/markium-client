import axios from 'axios';

import { HOST_API } from 'src/config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: HOST_API });
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    // Log the error for debugging
    console.error('Axios error intercepted:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });

    // Check for 401 status and redirect to login
    if (error.response?.status === 401) {
      // Clear session data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('zaity-user-info');

      // Redirect to login
      window.location.href = '/auth/jwt/login';
    }

    // Handle 422 validation errors explicitly
    if (error.response?.status === 422) {
      const errorData = error.response?.data || {
        message: 'Validation error',
        errors: {}
      };
      // Ensure we reject with the error data so show_error can handle it
      console.error('422 Validation Error:', errorData);
      return Promise.reject(errorData);
    }

    // Throw the error with consistent structure for all other errors
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
    delete:(id)=> `/products/${id}`,
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
  settings: {
    mainspecs: '/main-specs',
    items: (slug)=>`/${slug}`,
    categories: '/categories',
    categoriesList: '/categories/list',
    visibility: '/system-settings/visibility',
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
  },
  statistics: {
    root: '/attachments',
  },
  analytics: {
    overview: '/analytics/overview',
    traffic: '/analytics/traffic',
    funnel: '/analytics/funnel',
    topProducts: '/analytics/top-products',
  },

  store: {
    logo: '/store/logo',
    root: '/store',
    slug: (slug)=>`/stores/${slug}`,
  },
  shipping: {
    providers: '/shipping/providers',
    connections: '/shipping/connections',
    updateConnection: (connectionId) => `/shipping/connections/${connectionId}`,
    validateConnection: (connectionId) => `/shipping/connections/${connectionId}/validate`,
    setDefaultConnection: (connectionId) => `/shipping/connections/${connectionId}/set-default`,
    deleteConnection: (connectionId) => `/shipping/connections/${connectionId}`,
    orderRates: (orderId) => `/shipping/orders/${orderId}/rates`,
    orderRatesByProvider: (orderId) => `/shipping/orders/${orderId}/rates/by-provider`,
    refreshOrderRates: (orderId) => `/shipping/orders/${orderId}/rates/refresh`,
    shipOrder: (orderId) => `/shipping/orders/${orderId}/ship`,
  },
  payment: {
    providers: '/payment/providers',
    connections: '/payment/connections',
    updateConnection: (connectionId) => `/payment/connections/${connectionId}`,
    validateConnection: (connectionId) => `/payment/connections/${connectionId}/validate`,
    setDefaultConnection: (connectionId) => `/payment/connections/${connectionId}/set-default`,
    deleteConnection: (connectionId) => `/payment/connections/${connectionId}`,
  },
  subscriptions: {
    packages: '/subscriptions/packages',
    checkout: '/subscriptions/checkout',
    payments: '/subscriptions/payments',
    payment: (id) => `/subscriptions/payments/${id}`,
    current: '/subscriptions/current',
  },
};
