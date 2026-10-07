/* Resolve a stable media ID without coupling presentation to its hosting provider. */
(() => {
  'use strict';
  const safe = value => {
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; }
    catch { return ''; }
  };
  function resolve(asset, provider = 'original', language = 'en') {
    if (!asset || !['review', 'approved'].includes(asset.status)) return null;
    const original = safe(asset.sourceUrl);
    const hosted = provider === 'ghl' ? safe(asset.ghlUrl) : '';
    const src = hosted || original;
    if (!src) return null;
    const variants = hosted ? (asset.ghlVariants || []) : (asset.sourceVariants || []);
    const byWidth = new Map();
    for (const v of variants) {
      const url = safe(v.url);
      if (url && Number.isInteger(v.width) && v.width > 0) byWidth.set(v.width, url);
    }
    if (Number.isInteger(asset.width) && asset.width > 0) byWidth.set(asset.width, src);
    // An uploaded GHL image must not retain an original-host srcset.
    const srcset = byWidth.size > 1
      ? [...byWidth].sort((a, b) => a[0] - b[0]).map(([width, url]) => `${url} ${width}w`).join(', ')
      : '';
    return {
      id: asset.id, label: asset.label, kind: asset.kind,
      src, srcset, original, provider: hosted ? 'ghl' : 'original',
      width: asset.width, height: asset.height,
      alt: asset.alt?.[language] || asset.alt?.en || ''
    };
  }
  globalThis.COREMedia = Object.freeze({resolve});
})();
