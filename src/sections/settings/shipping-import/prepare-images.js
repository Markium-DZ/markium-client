// Turn uploaded files (PDF pages, photos, scans) into base64 JPEGs for the AI.
// Everything happens in the browser; pdf.js is loaded only when a PDF is picked.

export const MAX_PAGES = 5;
const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.85;

export class PrepareError extends Error {
  constructor(code) {
    super(code);
    this.code = code; // 'unsupported_image' | 'unsupported_file' | 'empty'
  }
}

function drawToBase64(source, width, height) {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY).split(',')[1];
}

async function imageToBase64(file) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new PrepareError('unsupported_image');
  }
  return drawToBase64(bitmap, bitmap.width, bitmap.height);
}

async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist');
  // eslint-disable-next-line import/no-unresolved
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

async function pdfToBase64Pages(file, limit) {
  const pdfjs = await loadPdfjs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = [];
  for (let n = 1; n <= Math.min(pdf.numPages, limit); n += 1) {
    // eslint-disable-next-line no-await-in-loop
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    // eslint-disable-next-line no-await-in-loop
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    pages.push(drawToBase64(canvas, canvas.width, canvas.height));
  }
  return { pages, total: pdf.numPages };
}

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
    if (file.type === 'application/pdf') {
      // eslint-disable-next-line no-await-in-loop
      const { pages, total } = await pdfToBase64Pages(file, remaining);
      images.push(...pages);
      if (total > pages.length) truncated = true;
    } else if (file.type.startsWith('image/')) {
      // eslint-disable-next-line no-await-in-loop
      images.push(await imageToBase64(file));
    } else {
      throw new PrepareError('unsupported_file');
    }
  }
  if (!images.length) throw new PrepareError('empty');
  return { images, truncated };
}
