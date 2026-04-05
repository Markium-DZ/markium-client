import { paths } from 'src/routes/paths';

// API
// ----------------------------------------------------------------------

export const api_version = import.meta.env.VITE_API_VERSION ;

export const HOST_API = import.meta.env.VITE_HOST_API ;
// export const HOST_API = "https://be-test.markium.online/api/v1" ;
export const ASSETS_API = import.meta.env.VITE_ASSETS_API;
export const STORAGE_API = import.meta.env.VITE_STORAGE_API ; 

export const FIREBASE_API = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APPID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const AMPLIFY_API = {
  userPoolId: import.meta.env.VITE_AWS_AMPLIFY_USER_POOL_ID,
  userPoolWebClientId: import.meta.env.VITE_AWS_AMPLIFY_USER_POOL_WEB_CLIENT_ID,
  region: import.meta.env.VITE_AWS_AMPLIFY_REGION,
};

export const AUTH0_API = {
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
  domain: import.meta.env.VITE_AUTH0_DOMAIN,
  callbackUrl: import.meta.env.VITE_AUTH0_CALLBACK_URL,
};

export const SUPABASE_API = {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

export const MAPBOX_API = import.meta.env.VITE_MAPBOX_API;

// PostHog Analytics (client-side tracking only)
export const POSTHOG_API = {
  key: import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
  host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
};

// STOREFRONT
// ----------------------------------------------------------------------

export const STOREFRONT_BASE_URL = import.meta.env.VITE_STOREFRONT_BASE_URL || 'https://{slug}.markium.online';

export const getStorefrontUrl = (slug, params) => {
  const base = STOREFRONT_BASE_URL.replace('{slug}', slug);
  if (!params) return base;
  const search = new URLSearchParams(params).toString();
  return `${base}?${search}`;
};

// ROOT PATH AFTER LOGIN SUCCESSFUL
export const PATH_AFTER_LOGIN = paths.dashboard.root; // as '/dashboard'
