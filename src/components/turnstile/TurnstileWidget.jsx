import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';

// Declare global Turnstile API
let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks = [];

function loadTurnstileScript() {
  if (scriptLoaded) return Promise.resolve();

  return new Promise((resolve) => {
    loadCallbacks.push(resolve);

    if (scriptLoading) return;
    scriptLoading = true;

    window.onTurnstileLoad = () => {
      scriptLoaded = true;
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
    script.async = true;
    document.head.appendChild(script);
  });
}

export default function TurnstileWidget({ siteKey, onVerify, onExpire, onError, ...other }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  // Store callbacks in refs to avoid re-renders
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  useEffect(() => {
    loadTurnstileScript().then(() => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onVerifyRef.current(token),
        'expired-callback': () => onExpireRef.current?.(),
        'error-callback': () => onErrorRef.current?.(),
        theme: 'light',
        size: 'flexible',
        retry: 'never',
        'refresh-expired': 'never',
      });
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return <Box ref={containerRef} {...other} />;
}

TurnstileWidget.propTypes = {
  siteKey: PropTypes.string.isRequired,
  onVerify: PropTypes.func.isRequired,
  onExpire: PropTypes.func,
  onError: PropTypes.func,
};
