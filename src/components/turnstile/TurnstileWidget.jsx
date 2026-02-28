import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
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

const TurnstileWidget = forwardRef(({ siteKey, onVerify, onExpire, onError, sx, ...other }, ref) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  // Store callbacks in refs to avoid re-renders
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  onVerifyRef.current = onVerify;
  onExpireRef.current = onExpire;
  onErrorRef.current = onError;

  useImperativeHandle(ref, () => ({
    execute: () => {
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.execute(containerRef.current);
      }
    },
    reset: () => {
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        // Re-trigger verification after reset since we use execution: 'execute'
        window.turnstile.execute(containerRef.current);
      }
    },
  }));

  useEffect(() => {
    loadTurnstileScript().then(() => {
      if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

      // Use execution: 'execute' to prevent Turnstile from creating a
      // full-page overlay that blocks form fields during verification.
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onVerifyRef.current(token),
        'expired-callback': () => onExpireRef.current?.(),
        'error-callback': () => onErrorRef.current?.(),
        theme: 'light',
        size: 'flexible',
        retry: 'auto',
        'refresh-expired': 'auto',
        execution: 'execute',
      });

      // Immediately trigger verification so it auto-verifies like 'render'
      // mode, but without the blocking overlay.
      window.turnstile.execute(containerRef.current);
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return <Box ref={containerRef} sx={sx} {...other} />;
});

TurnstileWidget.displayName = 'TurnstileWidget';

TurnstileWidget.propTypes = {
  siteKey: PropTypes.string.isRequired,
  onVerify: PropTypes.func.isRequired,
  onExpire: PropTypes.func,
  onError: PropTypes.func,
  sx: PropTypes.object,
};

export default TurnstileWidget;
