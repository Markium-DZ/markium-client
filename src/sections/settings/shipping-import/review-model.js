// Pure logic for the import review table — no React, no imports.

export const STATUS = { FOUND: 'found', CHECK: 'check', CONFLICT: 'conflict', MISSING: 'missing' };

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

// rates: [{ wilaya_id, home_price, desk_price }] (one per commune, prices may be null)
// -> Map<wilayaId, { home, desk, varies }> for wilayas with at least one priced commune
export function summarizeCurrent(rates) {
  const byWilaya = new Map();
  rates.forEach((r) => {
    const home = num(r.home_price);
    const desk = num(r.desk_price);
    if (home === null || desk === null) return;
    const list = byWilaya.get(r.wilaya_id) || [];
    list.push({ home, desk });
    byWilaya.set(r.wilaya_id, list);
  });
  const summary = new Map();
  byWilaya.forEach((list, wilayaId) => {
    const [first] = list;
    const same = list.every((p) => p.home === first.home && p.desk === first.desk);
    summary.set(wilayaId, same ? { ...first, varies: false } : { home: null, desk: null, varies: true });
  });
  return summary;
}

// wilayas: [{ id, code, ... }] (58); extracted rows match on the official code, current rates on id, extraction: chat-host response, rates: current per-commune rates
export function buildReviewRows(wilayas, extraction, rates) {
  const current = summarizeCurrent(rates);
  const extracted = new Map((extraction?.rows || []).map((r) => [r.wilaya_code, r]));

  const codeOf = (wilaya) => Number(wilaya.code ?? wilaya.id);

  return [...wilayas]
    .sort((a, b) => codeOf(a) - codeOf(b))
    .map((wilaya) => {
      const found = extracted.get(codeOf(wilaya));
      const cur = current.get(wilaya.id) || null;
      if (!found) {
        return { wilaya, home: '', desk: '', current: cur, status: STATUS.MISSING, note: null, choice: 'imported' };
      }
      const home = found.home_price ?? '';
      const desk = found.desk_price ?? '';
      const differs = cur && (cur.varies || cur.home !== num(home) || cur.desk !== num(desk));
      let status = STATUS.FOUND;
      if (differs) status = STATUS.CONFLICT;
      else if (found.confidence === 'low' || found.note) status = STATUS.CHECK;
      return {
        wilaya,
        home,
        desk,
        current: cur,
        status,
        note: found.note || null,
        choice: status === STATUS.CONFLICT ? 'current' : 'imported',
      };
    });
}

// Rows to save: imported choice with both prices filled and >= 0
export function buildSavePayload(rows) {
  return rows
    .filter((r) => r.choice === 'imported' && num(r.home) !== null && num(r.desk) !== null)
    .filter((r) => num(r.home) >= 0 && num(r.desk) >= 0)
    .map((r) => ({ wilaya_id: r.wilaya.id, home_price: num(r.home), desk_price: num(r.desk) }));
}
