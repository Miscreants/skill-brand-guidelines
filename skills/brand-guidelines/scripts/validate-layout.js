// Layout validator (read-only). Defines validateLayout(slides, opts) -> { ok, errors, warnings, ... }.
//
// Two ways to use it:
//  1. In every build call: paste after build-kit.js and end the script with
//       return { created, ...kit.report(), layout: await validateLayout(builtSlides) };
//  2. Standalone audit (e.g. after manual edits): paste this file, then
//       return await validateLayout(null, { pageId: '12:34' });   // null = every 1920x1080 frame on the page
//
// It measures the union of the text box and its rendered glyphs, so it catches overflow that clipping hides,
// words longer than a fixed-width box, text colliding with other text, and low-contrast labels.
// A build is not done until `errors` is empty. See SKILL.md "Validate & fix loop".

async function validateLayout(slides, opts = {}) {
  const MIN_INSET = opts.minInset ?? 8;      // text must sit this far inside its tile/card/pill (warning if closer)
  const MIN_FONT = opts.minFont ?? 11;       // smallest acceptable font size on a 1920x1080 slide
  const MIN_CONTRAST = opts.minContrast ?? 3; // WCAG large-text minimum for labels on solid fills

  if (opts.pageId) await figma.setCurrentPageAsync(await figma.getNodeByIdAsync(opts.pageId));
  if (!slides) slides = figma.currentPage.children.filter(n => n.type === 'FRAME' && Math.round(n.width) === 1920 && Math.round(n.height) === 1080);
  slides = await Promise.all(slides.map(s => typeof s === 'string' ? figma.getNodeByIdAsync(s) : s));

  const errors = [], warnings = [];
  const r = n => Math.round(n);
  // Union of glyph bounds and the text box: absoluteRenderBounds is cropped by clipping ancestors (so it hides
  // exactly the overflow we're looking for), while absoluteBoundingBox misses glyphs spilling past a fixed width.
  const box = n => {
    const a = n.absoluteBoundingBox, g = n.absoluteRenderBounds;
    if (!g) return a;
    const x = Math.min(a.x, g.x), y = Math.min(a.y, g.y);
    return { x, y, width: Math.max(a.x + a.width, g.x + g.width) - x, height: Math.max(a.y + a.height, g.y + g.height) - y };
  };
  const overflow = (a, b) => ({ l: b.x - a.x, t: b.y - a.y, r: (a.x + a.width) - (b.x + b.width), b: (a.y + a.height) - (b.y + b.height) });
  const worstOf = o => Math.max(o.l, o.t, o.r, o.b);
  const area = (a, b) => { const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x); const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y); return w > 2 && h > 2 ? r(w) + 'x' + r(h) : null; };
  const visible = n => { for (let p = n; p && p.type !== 'PAGE'; p = p.parent) if (p.visible === false) return false; return true; };
  const solid = n => Array.isArray(n.fills) && n.fills.find(f => f.visible !== false && f.type === 'SOLID' && (f.opacity ?? 1) > 0.5);
  const painted = p => (Array.isArray(p.fills) && p.fills.some(f => f.visible !== false && (f.opacity ?? 1) > 0)) || (Array.isArray(p.strokes) && p.strokes.some(s => s.visible !== false));
  const lum = c => { const f = v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

  // Nearest ancestor the eye reads as the text's box: a visible fill or stroke (tile, card, pill).
  // Layout-only wrappers (auto-layout stacks without paint) are skipped even though they clip by default.
  const container = (n, slide) => { for (let p = n.parent; p && p !== slide; p = p.parent) if (p.type !== 'GROUP' && p.type !== 'BOOLEAN_OPERATION' && painted(p)) return p; return slide; };
  // Nearest clipping ancestor below the slide; overflow past it is silently cut off.
  const clipper = (n, slide) => { for (let p = n.parent; p && p !== slide; p = p.parent) if (p.clipsContent) return p; return null; };
  const inInstance = n => { for (let p = n.parent; p && p.type !== 'PAGE'; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };

  for (const slide of slides) {
    if (!slide) continue;
    const S = slide.absoluteBoundingBox;
    const texts = slide.findAllWithCriteria({ types: ['TEXT'] }).filter(visible).filter(t => t.characters.trim());
    const add = (list, t, kind, detail) => list.push([slide.name, t.name.slice(0, 40), kind, detail, t.id]);

    for (const t of texts) {
      const rb = box(t);
      if (!rb) continue;
      const fs = t.fontSize === figma.mixed ? Math.min(...t.getStyledTextSegments(['fontSize']).map(s => s.fontSize)) : t.fontSize;
      if (fs < MIN_FONT) add(warnings, t, 'tiny-text', fs + 'px' + (inInstance(t) ? ' (inside a rescaled instance?)' : ''));
      // text inside component instances (button labels, logo artwork) belongs to the component: only check it stays on the slide
      if (inInstance(t)) { if (worstOf(overflow(rb, S)) > 0.5) add(errors, t, 'off-slide', 'inside instance'); continue; }
      const c = container(t, slide);
      const inset = c === slide ? 0 : MIN_INSET;
      const o = overflow(rb, c.absoluteBoundingBox);
      if (worstOf(o) > -inset + 0.5) {
        const sides = Object.entries(o).filter(([, v]) => v > -inset + 0.5).map(([k, v]) => `${k}${v > 0 ? '+' : ''}${r(v)}`).join(' ');
        // past the edge = error; inside but closer than MIN_INSET = warning
        if (worstOf(o) > 0.5) add(errors, t, 'overflow', `past '${c.name}' ${sides}${c.clipsContent ? ' (hidden by clip)' : ''}`);
        else add(warnings, t, 'tight', `in '${c.name}' ${sides}`);
      }
      const k = clipper(t, slide);
      if (k && k !== c && worstOf(overflow(rb, k.absoluteBoundingBox)) > 0.5) add(errors, t, 'clipped', `cut off by '${k.name}'`);
      const g = t.absoluteRenderBounds;
      if (g && t.textAutoResize !== 'WIDTH_AND_HEIGHT' && g.width > t.width + 1) add(errors, t, 'word-overflow', `glyphs ${r(g.width)}px > box ${r(t.width)}px`);
      if (g && t.textAutoResize === 'NONE' && t.textTruncation !== 'ENDING' && g.height > t.height + 1) add(errors, t, 'clipped-height', `glyphs ${r(g.height)}px > box ${r(t.height)}px`);
      if (worstOf(overflow(rb, S)) > 0.5) add(errors, t, 'off-slide', '');
      // a short one-line value (hex, RGB, label) broken over two lines inside a tile: fits, but reads badly
      if (c !== slide && !t.characters.includes('\n') && t.characters.length <= 32 && t.height > fs * 1.9) add(warnings, t, 'wrapped-label', `"${t.characters}" wraps in '${c.name}' (${r(c.width)}px wide)`);
      const tf = solid(t), bg = solid(c) || (c === slide && solid(slide));
      if (tf && bg) { const cr = ratio(tf.color, bg.color); if (cr < MIN_CONTRAST) add(warnings, t, 'low-contrast', cr.toFixed(2) + ':1'); }
    }

    // text colliding with other text (e.g. a long title running into the copy); component artwork excluded
    const free = texts.filter(t => !inInstance(t));
    for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) {
      const a = box(free[i]), b = box(free[j]);
      const hit = a && b && area(a, b);
      if (hit) errors.push([slide.name, free[i].name.slice(0, 30) + ' × ' + free[j].name.slice(0, 30), 'text-collision', hit, free[i].id]);
    }

    // shapes spilling off the slide (slides clip, so that content is lost); intentional bleeds can be ignored
    for (const n of slide.children) {
      if (!visible(n) || n.type === 'TEXT') continue;
      const o = overflow(n.absoluteBoundingBox, S);
      if (worstOf(o) > 1) warnings.push([slide.name, n.name.slice(0, 40), 'off-slide', `l${r(o.l)} t${r(o.t)} r${r(o.r)} b${r(o.b)}`, n.id]);
    }
  }

  return {
    slides: slides.length, ok: errors.length === 0, legend: '[slide, node, kind, detail, nodeId]',
    errors: errors.slice(0, 60), errorCount: errors.length,
    warnings: warnings.slice(0, 30), warningCount: warnings.length,
  };
}
