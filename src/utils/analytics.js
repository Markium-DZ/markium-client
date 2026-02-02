import posthog from 'posthog-js';

import { POSTHOG_API } from 'src/config-global';

// ----------------------------------------------------------------------

let initialized = false;

/**
 * Initialize PostHog for SaaS admin event tracking.
 * Called once at app startup from main.jsx.
 */
export function initPostHog() {
  if (initialized || !POSTHOG_API.key) return;

  posthog.init(POSTHOG_API.key, {
    api_host: POSTHOG_API.host,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
  });

  initialized = true;
}

/**
 * Identify a client after login/register.
 * Sets person properties and registers super properties.
 */
export function identifyClient(client) {
  if (!initialized || !client) return;

  const distinctId = `client:${client.id}`;

  posthog.identify(distinctId, {
    name: client.name,
    phone: client.phone,
    store_name: client.store?.name,
    store_ref: client.store?.ref,
    store_slug: client.store?.slug,
  });

  // Super properties auto-attached to all future events
  posthog.register({
    client_id: client.id,
    store_ref: client.store?.ref,
    store_name: client.store?.name,
  });
}

/**
 * Reset PostHog on logout.
 */
export function resetAnalytics() {
  if (!initialized) return;
  posthog.reset();
}

/**
 * Capture a SaaS lifecycle event.
 * client_id and store_ref are auto-included via super properties.
 */
export function capture(eventName, properties = {}) {
  if (!initialized) return;
  posthog.capture(eventName, properties);
}
