import posthog from 'posthog-js';

import { POSTHOG_API } from 'src/config-global';

// ----------------------------------------------------------------------

export function initPostHog() {
  const { key, host } = POSTHOG_API;

  if (!key) {
    console.warn('PostHog: No API key found, skipping initialization');
    return;
  }

  posthog.init(key, {
    api_host: host,
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
  });
}

// ----------------------------------------------------------------------

export function identifyUser(user) {
  if (!user) return;

  const userId = user.id || user.phone;
  if (!userId) return;

  posthog.identify(String(userId), {
    name: user.name,
    phone: user.phone,
    store_slug: user.store?.slug,
    store_name: user.store?.name,
  });

  // Register store_slug as a super property so ALL events include it
  posthog.register({ store_slug: user.store?.slug });
}

// ----------------------------------------------------------------------

export function resetPostHog() {
  posthog.reset();
}

// ----------------------------------------------------------------------

export function captureEvent(name, props) {
  posthog.capture(name, props);
}
