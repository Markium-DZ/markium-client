import posthog from 'posthog-js';

import { POSTHOG_API } from 'src/config-global';

// ----------------------------------------------------------------------

// Kill switch: PostHog only runs when VITE_POSTHOG_ENABLED=true at build time.
// Off by default — the PostHog service is paused and must never break the app.
const POSTHOG_ENABLED = import.meta.env.VITE_POSTHOG_ENABLED === 'true';

// Analytics is best-effort: run a PostHog call only once initialized, and
// never let it throw into the caller.
function safely(fn) {
  if (!posthog.__loaded) return;
  try {
    fn();
  } catch {
    /* analytics is best-effort */
  }
}

export function initPostHog() {
  if (!POSTHOG_ENABLED) return;

  const { key, host } = POSTHOG_API;

  if (!key) {
    console.warn('PostHog: No API key found, skipping initialization');
    return;
  }

  // Never from non-production hosts — localhost and the workers.dev staging
  // dashboard ship the prod PostHog key and polluted the project.
  // Deliberate debugging: ?ph_debug=1.
  const { hostname, search } = window.location;
  const isNonProdHost =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.workers.dev');
  if (isNonProdHost && new URLSearchParams(search).get('ph_debug') !== '1') {
    return;
  }

  try {
    posthog.init(key, {
      api_host: host,
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
    });
  } catch {
    /* analytics is best-effort */
  }
}

// ----------------------------------------------------------------------

export function identifyUser(user) {
  if (!user) return;

  const userId = user.id || user.phone;
  if (!userId) return;

  safely(() => {
    posthog.identify(String(userId), {
      name: user.name,
      phone: user.phone,
      store_slug: user.store?.slug,
      store_name: user.store?.name,
    });

    // Register store_slug as a super property so ALL events include it
    posthog.register({ store_slug: user.store?.slug });
  });
}

// ----------------------------------------------------------------------

export function resetPostHog() {
  safely(() => posthog.reset());
}

// ----------------------------------------------------------------------

export function captureEvent(name, props) {
  safely(() => posthog.capture(name, props));
}
