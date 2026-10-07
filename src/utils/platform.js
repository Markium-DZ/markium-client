let _isNative = false;
let _initialized = false;

function init() {
  if (_initialized) return;
  _initialized = true;
  try {
    // Check if running inside Capacitor native shell
    // Capacitor injects window.Capacitor when running natively
    _isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  } catch {
    _isNative = false;
  }
}

export const isNativePlatform = () => {
  init();
  return _isNative;
};

export const getPlatform = () => {
  if (!isNativePlatform()) return 'web';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
  return 'web';
};

export const isIos = () => getPlatform() === 'ios';
export const isAndroid = () => getPlatform() === 'android';
