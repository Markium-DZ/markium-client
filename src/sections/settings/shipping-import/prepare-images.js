// Turn uploaded files (PDF pages, photos, scans) into base64 JPEGs for the AI.
// Everything happens in the browser; pdf.js is loaded only when a PDF is picked.

export const MAX_PAGES = 5;
const MAX_SIDE = 2000;
// Whole request must stay under ~11 MB of base64; budget it per page.
const MAX_IMAGE_CHARS = Math.floor(11_000_000 / MAX_PAGES);
const JPEG_QUALITIES = [0.85, 0.7, 0.55];

export class PrepareError extends Error {
  constructor(code) {
    super(code);
    // 'unsupported_image' | 'unsupported_file' | 'pdf_protected' | 'empty'
    this.code = code;
  }
}

function getContext(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new PrepareError('unsupported_image');
  return ctx;
}

// Encodes the canvas as base64 JPEG (lowering quality if too big), then frees it.
function encodeAndFree(canvas) {
  let data = '';
  JPEG_QUALITIES.some((quality) => {
    const url = canvas.toDataURL('image/jpeg', quality);
    if (!url.startsWith('data:image/jpeg')) throw new PrepareError('unsupported_image');
    data = url.split(',')[1];
    return data.length <= MAX_IMAGE_CHARS;
  });
  canvas.width = 0;
  canvas.height = 0;
  return data;
}

async function imageToBase64(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new PrepareError('unsupported_image');
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = getContext(canvas);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return encodeAndFree(canvas);
}

// Legacy build: works on older iOS WebViews (no Promise.withResolvers).
async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  // eslint-disable-next-line import/no-unresolved
  const worker = await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

async function pdfToBase64Pages(file, limit) {
  let pdf;
  try {
    const pdfjs = await loadPdfjs();
    pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  } catch (err) {
    throw new PrepareError(err?.name === 'PasswordException' ? 'pdf_protected' : 'unsupported_file');
  }
  try {
    const pages = [];
    for (let n = 1; n <= Math.min(pdf.numPages, limit); n += 1) {
      // eslint-disable-next-line no-await-in-loop
      const page = await pdf.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const scale = Math.min(2, MAX_SIDE / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = getContext(canvas);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // eslint-disable-next-line no-await-in-loop
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push(encodeAndFree(canvas));
      page.cleanup();
    }
    return { pages, total: pdf.numPages };
  } finally {
    await pdf.destroy();
  }
}

const isPdf = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
const isImage = (file) =>
  file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);

// Returns { images: string[], truncated: boolean }
export async function prepareImages(files) {
  const images = [];
  let truncated = false;
  // eslint-disable-next-line no-restricted-syntax
  for (const file of files) {
    const remaining = MAX_PAGES - images.length;
    if (remaining <= 0) {
      truncated = true;
      break;
    }
    if (isPdf(file)) {
      // eslint-disable-next-line no-await-in-loop
      const { pages, total } = await pdfToBase64Pages(file, remaining);
      images.push(...pages);
      if (total > pages.length) truncated = true;
    } else if (isImage(file)) {
      // eslint-disable-next-line no-await-in-loop
      images.push(await imageToBase64(file));
    } else {
      throw new PrepareError('unsupported_file');
    }
  }
  if (!images.length) throw new PrepareError('empty');
  return { images, truncated };
}
