import { isNativePlatform } from 'src/utils/platform';

// ----------------------------------------------------------------------

/**
 * Makes a carrier's HTML label document print-ready: keeps its relative assets
 * working (<base> = original file URL) and opens the print dialog once loaded,
 * so the merchant can print every label at once or "Save as PDF".
 */
export function buildPrintableHtml(html, baseUrl) {
  const base = baseUrl ? `<base href="${String(baseUrl).replace(/"/g, '&quot;')}">` : '';
  const printScript =
    '<script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},400);});</script>';
  let doc = String(html || '');
  doc = /<head[^>]*>/i.test(doc) ? doc.replace(/<head[^>]*>/i, (m) => `${m}${base}`) : `${base}${doc}`;
  doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, `${printScript}</body>`) : `${doc}${printScript}`;
  return doc;
}

/**
 * Reserve a browser tab *synchronously* (inside the click handler) so a URL
 * obtained after an `await` can still be opened without the popup blocker
 * swallowing it. In the Capacitor shell there is no popup blocker: the URL is
 * simply handed to window.open, which Capacitor routes to the system browser.
 *
 * Usage:
 *   const tab = reserveExternalTab();
 *   try { const url = await fetchUrl(); tab.open(url); } catch { tab.cancel(); }
 */
export function reserveExternalTab() {
  if (isNativePlatform()) {
    return {
      open: (url) => {
        if (url) window.open(url, '_blank');
      },
      // No reserved tab in the app shell: fall back to the carrier's own page
      openHtml: (html, url) => {
        if (url) window.open(url, '_blank');
      },
      cancel: () => {},
    };
  }

  let win = null;
  try {
    win = window.open('', '_blank');
  } catch {
    win = null;
  }

  return {
    open: (url) => {
      if (!url) {
        try {
          win?.close();
        } catch {
          /* ignore */
        }
        return;
      }
      if (win && !win.closed) {
        try {
          win.opener = null;
        } catch {
          /* ignore */
        }
        win.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    // Write a print-ready copy of an HTML document into the reserved tab
    openHtml: (html, url) => {
      if (!html || !win || win.closed) {
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      try {
        win.document.open();
        win.document.write(buildPrintableHtml(html, url));
        win.document.close();
      } catch {
        if (url) win.location.href = url;
      }
    },
    cancel: () => {
      try {
        win?.close();
      } catch {
        /* ignore */
      }
    },
  };
}

export function openExternalUrl(url) {
  if (!url) return;
  if (isNativePlatform()) window.open(url, '_blank');
  else window.open(url, '_blank', 'noopener,noreferrer');
}

// Backend errors are rejected as the response body: { success:false, error:{ code, message } }
export function getApiErrorMessage(error, fallback) {
  return error?.error?.message || error?.message || fallback;
}
