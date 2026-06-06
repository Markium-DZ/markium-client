// Wilaya map utilities: GeoJSON projection, data normalization, color scales.

export function normalizeName(s) {
  return (s || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export function buildProjection(features) {
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  const visitPoint = ([lon, lat]) => {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  };

  features.forEach((f) => {
    const { type, coordinates } = f.geometry || {};
    if (type === 'Polygon') {
      coordinates.forEach((ring) => ring.forEach(visitPoint));
    } else if (type === 'MultiPolygon') {
      coordinates.forEach((poly) => poly.forEach((ring) => ring.forEach(visitPoint)));
    }
  });

  const centerLat = (minLat + maxLat) / 2;
  const cosCenter = Math.cos((centerLat * Math.PI) / 180);
  const WIDTH = 1000;
  const lonSpan = (maxLon - minLon) * cosCenter;
  const latSpan = maxLat - minLat;
  const scale = WIDTH / lonSpan;
  const HEIGHT = latSpan * scale;

  return {
    width: WIDTH,
    height: HEIGHT,
    project: ([lon, lat]) => [(lon - minLon) * cosCenter * scale, (maxLat - lat) * scale],
  };
}

export function featureToPathD(feature, projection) {
  const ring2d = (ring) => {
    let d = '';
    for (let i = 0; i < ring.length; i += 1) {
      const [x, y] = projection.project(ring[i]);
      d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }
    return `${d}Z`;
  };

  const { type, coordinates } = feature.geometry || {};
  if (type === 'Polygon') return coordinates.map(ring2d).join(' ');
  if (type === 'MultiPolygon') return coordinates.flatMap((poly) => poly.map(ring2d)).join(' ');
  return '';
}

// ----------------------------------------------------------------------

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

function rgbStr({ r, g, b }, alpha = 1) {
  return alpha < 1 ? `rgba(${r}, ${g}, ${b}, ${alpha})` : `rgb(${r}, ${g}, ${b})`;
}

export function interpolateColor(stops, t) {
  const clamped = Math.max(0, Math.min(1, t));
  const segments = stops.length - 1;
  const idx = Math.min(segments - 1, Math.floor(clamped * segments));
  const local = (clamped * segments) - idx;
  const a = hexToRgb(stops[idx]);
  const b = hexToRgb(stops[idx + 1]);
  return rgbStr({
    r: Math.round(a.r + (b.r - a.r) * local),
    g: Math.round(a.g + (b.g - a.g) * local),
    b: Math.round(a.b + (b.b - a.b) * local),
  });
}

// ----------------------------------------------------------------------

// "Beautiful" warm-positive gradient for high-order wilayas.
export const ORDERS_STOPS = ['#E8FBF1', '#9DEBC2', '#3DD68C', '#16A34A', '#065F46'];

// "Sad" cool-desaturated gradient for high-return wilayas.
export const RETURNS_STOPS = ['#F1F1F5', '#C8C9D9', '#7679B6', '#3D4191', '#1E1F4D'];

export function ordersColorFor(t) {
  return interpolateColor(ORDERS_STOPS, t);
}

export function returnsColorFor(t) {
  return interpolateColor(RETURNS_STOPS, t);
}
