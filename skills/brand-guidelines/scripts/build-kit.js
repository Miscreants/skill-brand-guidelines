// build-kit.js: prepend to every build `use_figma` call, after defining CONFIG.
// Keep CONFIG small: only what this call needs. Shape:
// const CONFIG = {
//   brand: 'Acme', version: 'Version 1.0', year: '2026', domain: 'ACME.COM', credit: 'Designed by Agency',
//   shell: 'editorial' | 'card' | 'running' | 'sidebar',
//   roles: { bg:{hex:'#F5ECDF', varId:'VariableID:..'}, surface:{hex}, surfaceAlt:{hex}, text:{hex,varId}, textMuted:{hex},
//            accent:{hex,varId}, onAccent:{hex}, line:{hex}, gradient:{stops:['#A466CC','#182FA0']} },
//   fonts: { display:{family:'DM Sans', style:'ExtraBold'}, body:{family:'DM Sans', style:'Regular'}, mono:{family:'DM Mono', style:'Regular'} },
//   radius: 20,
// };
// Then: await kit.init(); ... build ...; return { ...kit.report(), created: [...] };

const kit = (() => {
  const subs = [], todos = [], unbound = [];
  const vars = {};
  const loaded = {};

  const rgb = h => { h = h.replace('#', ''); return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 }; };
  const lum = h => { const c = rgb(h); const f = v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100; };
  const rgbStr = h => { const c = rgb(h); return `RGB (${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`; };
  // naive device CMYK, always label as approximate
  const cmykApprox = h => { const c = rgb(h); const k = 1 - Math.max(c.r, c.g, c.b); if (k === 1) return 'C0 M0 Y0 K100'; const f = v => Math.round(((1 - v - k) / (1 - k)) * 100); return `C${f(c.r)} M${f(c.g)} Y${f(c.b)} K${Math.round(k * 100)} (approx.)`; };

  async function init() {
    for (const [role, r] of Object.entries(CONFIG.roles || {})) {
      if (r && r.varId) { const v = await figma.variables.getVariableByIdAsync(r.varId); if (v) vars[role] = v; else unbound.push(role); }
    }
  }

  // Load a font, falling back to Inter (same weight name if possible). Returns the FontName actually used.
  async function font(f) {
    const key = f.family + '|' + f.style;
    if (loaded[key]) return loaded[key];
    try { await figma.loadFontAsync(f); loaded[key] = f; return f; } catch (e) {}
    const style = ['Regular', 'Medium', 'Semi Bold', 'Bold', 'Extra Bold', 'Light', 'Thin', 'Black'].find(s => s.replace(' ', '').toLowerCase() === f.style.replace(' ', '').toLowerCase()) || 'Regular';
    const fb = { family: 'Inter', style };
    await figma.loadFontAsync(fb);
    subs.push(`${f.family} ${f.style} -> Inter ${style}`);
    loaded[key] = fb; return fb;
  }

  // Solid paint for a role ('text') or raw hex ('#112233'); bound to the role's variable when available.
  function paint(roleOrHex, opacity) {
    const isHex = roleOrHex.startsWith('#');
    const h = isHex ? roleOrHex : (CONFIG.roles[roleOrHex] || {}).hex || '#FF00FF';
    let p = { type: 'SOLID', color: rgb(h) };
    if (opacity != null && opacity < 1) p.opacity = opacity;
    if (!isHex && vars[roleOrHex]) p = figma.variables.setBoundVariableForPaint(p, 'color', vars[roleOrHex]);
    return p;
  }
  function gradient(stops, angle) {
    const s = stops || (CONFIG.roles.gradient && CONFIG.roles.gradient.stops) || [CONFIG.roles.accent.hex, CONFIG.roles.text.hex];
    const a = ((angle ?? 90) * Math.PI) / 180;
    return { type: 'GRADIENT_LINEAR', gradientTransform: [[Math.cos(a), Math.sin(a), 0], [-Math.sin(a), Math.cos(a), 0]],
      gradientStops: s.map((h, i) => ({ position: i / Math.max(1, s.length - 1), color: { ...rgb(h), a: 1 } })) };
  }

  // Text node. o: { font:'display'|'body'|'mono'|{family,style}, size, color, width, name, styleId, upper, tracking(%), lh(%), align, opacity, x, y }
  async function text(parent, chars, o = {}) {
    const t = figma.createText();
    parent.appendChild(t);
    let styled = false;
    if (o.styleId) {
      const st = await figma.getStyleByIdAsync(o.styleId);
      if (st && st.type === 'TEXT') {
        const want = st.fontName, f = await font(want);
        // compare by value: fontName getters return a fresh object on every read
        if (f.family === want.family && f.style === want.style) { await t.setTextStyleIdAsync(st.id); styled = true; }
        else unbound.push('text style ' + st.name + ' (font unavailable)');
      }
    }
    if (!styled) {
      const f = typeof o.font === 'object' ? o.font : CONFIG.fonts[o.font || 'body'];
      t.fontName = await font(f);
      t.fontSize = o.size || 20;
      if (o.lh) t.lineHeight = { unit: 'PERCENT', value: o.lh };
      if (o.tracking) t.letterSpacing = { unit: 'PERCENT', value: o.tracking };
    }
    t.characters = String(chars);
    if (o.upper) t.textCase = 'UPPER';
    t.fills = [paint(o.color || 'text', o.opacity)];
    if (o.align) t.textAlignHorizontal = o.align;
    if (o.name) t.name = o.name;
    if (o.fit) fit(t, o.fit, o.minSize);
    else if (o.width) { t.resize(o.width, Math.max(1, t.height)); t.textAutoResize = 'HEIGHT'; }
    if (o.x != null) t.x = o.x;
    if (o.y != null) t.y = o.y;
    return t;
  }

  // Make a short label fit maxW: shrink the font one step at a time (not below minSize), then wrap as a last resort.
  // Use for labels in tiles/pills/table cells; use `width` for paragraphs, which should always wrap.
  function fit(t, maxW, minSize = 12) {
    t.textAutoResize = 'WIDTH_AND_HEIGHT';
    if (t.fontSize !== figma.mixed) while (t.width > maxW && t.fontSize > minSize) t.fontSize = t.fontSize - 1;
    if (t.width > maxW) { t.resize(maxW, Math.max(1, t.height)); t.textAutoResize = 'HEIGHT'; }
    return t;
  }

  // Lay out n cells in an area: as many columns as fit at >= minW each (default 180, enough for an RGB label),
  // then rows. Returns [{x,y,w,h}]. o: { gap, minW, maxCols, h (fixed cell height; default fills the area) }
  function grid(n, area, o = {}) {
    const gap = o.gap ?? 16, minW = o.minW ?? 180;
    let cols = Math.min(n, o.maxCols ?? n);
    while (cols > 1 && (area.w - gap * (cols - 1)) / cols < minW) cols--;
    const rows = Math.ceil(n / cols);
    const w = (area.w - gap * (cols - 1)) / cols;
    const h = o.h ?? (area.h - gap * (rows - 1)) / rows;
    return Array.from({ length: n }, (_, i) => ({ x: area.x + (i % cols) * (w + gap), y: area.y + Math.floor(i / cols) * (h + gap), w, h }));
  }

  // Plain frame/rect. o: { name, x, y, w, h, fill(role|hex|paint), radius, stroke(role|hex), strokeW, dashed, clip }
  function box(parent, o = {}) {
    const f = figma.createFrame();
    parent.appendChild(f);
    f.name = o.name || 'Box';
    f.resize(o.w || 100, o.h || 100);
    f.x = o.x || 0; f.y = o.y || 0;
    f.fills = o.fill ? [typeof o.fill === 'string' ? paint(o.fill, o.opacity) : o.fill] : [];
    if (o.radius) f.cornerRadius = o.radius;
    if (o.stroke) { f.strokes = [paint(o.stroke)]; f.strokeWeight = o.strokeW || 1; if (o.dashed) f.dashPattern = [8, 6]; }
    f.clipsContent = !!o.clip;
    return f;
  }

  // Auto-layout container (append first, then FILL/HUG children). o: { name, gap, pad:[l,t,r,b], fill, radius, x, y, w, align }
  function stack(parent, dir, o = {}) {
    const f = figma.createAutoLayout(dir, { name: o.name || 'Stack', itemSpacing: o.gap ?? 16 });
    parent.appendChild(f);
    const [l, t, r, b] = o.pad || [0, 0, 0, 0];
    f.paddingLeft = l; f.paddingTop = t; f.paddingRight = r ?? l; f.paddingBottom = b ?? t;
    f.fills = o.fill ? [typeof o.fill === 'string' ? paint(o.fill) : o.fill] : [];
    f.clipsContent = false; // auto-layout clips by default, which would hide overflow from validateLayout and the viewer
    if (o.radius) f.cornerRadius = o.radius;
    if (o.w) {
      // resize() pins both axes to FIXED; give the width axis FIXED and let the other axis hug again
      f.resize(o.w, Math.max(1, f.height));
      if (dir === 'HORIZONTAL') { f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'AUTO'; }
      else { f.counterAxisSizingMode = 'FIXED'; f.primaryAxisSizingMode = 'AUTO'; }
    }
    if (o.align) f.primaryAxisAlignItems = o.align;
    if (o.x != null) f.x = o.x;
    if (o.y != null) f.y = o.y;
    return f;
  }

  // Visible placeholder for missing assets/copy/values; recorded for the final report.
  async function todo(parent, what, o = {}) {
    const b = box(parent, { name: 'TODO: ' + what, x: o.x, y: o.y, w: o.w || 400, h: o.h || 240, fill: 'surfaceAlt', stroke: 'textMuted', dashed: true, radius: o.radius || 0 });
    await text(b, 'TODO — ' + what, { font: 'mono', size: 14, color: 'textMuted', width: (o.w || 400) - 40, x: 20, y: 20, name: 'TODO label' });
    todos.push(`${parent.name}: ${what}`);
    return b;
  }

  // ---------- shell chrome ----------
  // Every chrome returns { title:{x,y,w}, copy:{x,y,w}, content:{x,y,w,h} } for the content-page layout.
  const shells = {
    async editorial(s, ctx) {
      s.fills = [paint('bg')];
      const foot = stack(s, 'HORIZONTAL', { name: 'Chrome/Footer', gap: 24, pad: [100, 8, 100, 8], x: 0, y: 979, w: 1920, align: 'SPACE_BETWEEN' });
      await text(foot, 'brand guidelines', { font: 'mono', size: 13, color: 'textMuted', name: 'Slot/Section' });
      await text(foot, 'P' + String(ctx.page).padStart(2, '0'), { font: 'mono', size: 13, color: 'textMuted', name: 'Slot/PageNumber' });
      return { title: { x: 100, y: 100, w: 480 }, copy: { x: 100, y: 210, w: 394 }, content: { x: 681, y: 213, w: 1138, h: 604 } };
    },
    async card(s, ctx) {
      s.fills = [paint('surfaceAlt')];
      const bar = box(s, { name: 'Chrome/Header', x: 0, y: 0, w: 1920, h: 68, fill: 'surface' });
      await text(bar, CONFIG.brand, { font: 'display', size: 26, x: 67, y: 18, name: 'Slot/Logo' });
      const pills = stack(bar, 'HORIZONTAL', { name: 'Pills', gap: 10, y: 17 });
      for (const label of [ctx.sectionLabel, CONFIG.version]) {
        const p = stack(pills, 'HORIZONTAL', { name: 'Pill', pad: [50, 9, 50, 9], fill: 'accent', radius: 90 });
        await text(p, label, { font: 'body', size: 18, color: 'onAccent', upper: true });
      }
      pills.x = 1852 - pills.width;
      return { title: { x: 87, y: 823, w: 695 }, copy: { x: 87, y: 880, w: 695 }, content: { x: 67, y: 108, w: 1786, h: 655 }, infoCard: { x: 67, y: 803, w: 735, h: 210 } };
    },
    async running(s, ctx) {
      s.fills = [paint('surfaceAlt')];
      const meta = [[CONFIG.version, 120, 47, 'LEFT'], [CONFIG.brand, 760, 47, 'CENTER'], [CONFIG.year, 1400, 47, 'RIGHT'],
        [ctx.sectionLabel, 760, 1003, 'CENTER'], ['Page ' + String(ctx.page).padStart(2, '0'), 1400, 1003, 'RIGHT']];
      for (const [t, x, y, al] of meta) await text(s, t, { font: 'body', size: 24, color: 'textMuted', x, y, width: al === 'LEFT' ? 400 : 400, align: al, name: 'Chrome/Meta' });
      const rule = figma.createLine(); s.appendChild(rule); rule.name = 'Chrome/Rule'; rule.resize(1678, 0); rule.x = 122; rule.y = 960; rule.strokes = [paint('line')];
      return { title: { x: 120, y: 142, w: 630 }, copy: { x: 120, y: 330, w: 630 }, content: { x: 850, y: 219, w: 950, h: 700 } };
    },
    async sidebar(s, ctx) {
      s.fills = [paint('surface')];
      for (const [name, y, l, r] of [['Chrome/Header', 0, ctx.sectionLabel, CONFIG.domain || CONFIG.brand], ['Chrome/Footer', 978, 'Brand Guidelines', `${CONFIG.year} ${CONFIG.version}`]]) {
        const bar = stack(s, 'HORIZONTAL', { name, pad: [120, 40, 120, 40], x: 0, y, w: 1920, align: 'SPACE_BETWEEN' });
        await text(bar, l, { font: 'mono', size: 18, color: 'textMuted', upper: true, tracking: 10, name: name.endsWith('Header') ? 'Header Title' : 'Footer Text Left' });
        await text(bar, r, { font: 'mono', size: 18, color: 'textMuted', upper: true, tracking: 10, name: name.endsWith('Header') ? 'Header Text Right' : 'Footer Text Right' });
      }
      box(s, { name: 'Sidebar', x: 0, y: 102, w: 667, h: 876, fill: 'surfaceAlt' });
      return { title: { x: 120, y: 142, w: 427 }, copy: { x: 120, y: 240, w: 427 }, content: { x: 730, y: 152, w: 1070, h: 780 } };
    },
  };

  // Content page = chrome + title + copy. Returns the content box for the module's visual.
  async function contentPage(s, { title, copy, sectionLabel, page }) {
    [...s.children].forEach(c => c.remove());
    const L = await shells[CONFIG.shell](s, { sectionLabel, page });
    let parent = s, t = L.title, c = L.copy;
    if (L.infoCard) {
      parent = box(s, { name: 'Info Card', ...L.infoCard, fill: 'surface', stroke: 'line', radius: CONFIG.radius || 20 });
      t = { x: 20, y: 20, w: 695 }; c = { x: 20, y: 80, w: 695 };
    }
    const T = await text(parent, title, { font: 'display', size: CONFIG.shell === 'sidebar' ? 32 : CONFIG.shell === 'card' ? 40 : 58, x: t.x, y: t.y, width: t.w, name: CONFIG.shell === 'sidebar' ? 'Sidebar Title' : 'Slot/Title', lh: 120 });
    if (copy) await text(parent, copy, { font: 'body', size: CONFIG.shell === 'card' ? 18 : 20, x: c.x, y: Math.max(c.y, t.y + T.height + 24), width: c.w, lh: 150, name: CONFIG.shell === 'sidebar' ? 'Sidebar Description' : 'Slot/Copy' });
    return L.content;
  }

  // Divider / cover: a big label in the shell's style.
  async function divider(s, { label, sub, page, cover }) {
    [...s.children].forEach(c => c.remove());
    const sh = CONFIG.shell;
    if (sh === 'editorial') {
      s.fills = [paint('bg')];
      await text(s, label, { font: 'display', size: cover ? 200 : 140, x: 100, y: cover ? 650 : 430, width: 1600, lh: 100, name: 'Slot/Title' });
      if (sub) await text(s, sub, { font: 'mono', size: 20, x: 100, y: 953, name: 'Slot/Credit' });
    } else if (sh === 'card') {
      s.fills = [paint('surface')];
      const grid = box(s, { name: 'Grid', x: 0, y: 0, w: 1920, h: 1080 });
      for (let x = 67; x < 1920; x += 105) { const l = figma.createLine(); grid.appendChild(l); l.rotation = -90; l.resize(1080, 0); l.x = x; l.y = 0; l.strokes = [paint('line')]; }
      for (let y = 68; y < 1080; y += 105) { const l = figma.createLine(); grid.appendChild(l); l.resize(1920, 0); l.x = 0; l.y = y; l.strokes = [paint('line')]; }
      const card = stack(s, 'HORIZONTAL', { name: 'Label Card', pad: [46, 31, 46, 31], fill: 'surface', radius: 40, x: 152, y: cover ? 363 : 678 });
      card.strokes = [paint('text')]; card.strokeWeight = 3;
      card.effects = [{ type: 'DROP_SHADOW', color: { ...rgb(CONFIG.roles.text.hex), a: 1 }, offset: { x: 12, y: 12 }, radius: 0, spread: 0, visible: true, blendMode: 'NORMAL' }];
      await text(card, label, { font: 'display', size: 160, lh: 90, name: 'Slot/Title' });
    } else if (sh === 'running') {
      s.fills = [paint('text')];
      box(s, { name: 'Gradient Strip', x: 0, y: 0, w: 36, h: 1080, fill: gradient(null, 90) });
      if (!cover) {
        for (const [t, x, y, al] of [[CONFIG.version, 120, 47, 'LEFT'], [CONFIG.brand, 760, 47, 'CENTER'], [CONFIG.year, 1400, 47, 'RIGHT'],
          [label.replace(/^(\d+)\.\s*/, (m, n) => n.padStart(2, '0') + ' / '), 760, 1003, 'CENTER'], ['Page ' + String(page).padStart(2, '0'), 1400, 1003, 'RIGHT']])
          await text(s, t, { font: 'body', size: 24, color: 'surface', x, y, width: 400, align: al, name: 'Chrome/Meta' });
        const rule = figma.createLine(); s.appendChild(rule); rule.name = 'Chrome/Rule'; rule.resize(1678, 0); rule.x = 122; rule.y = 960; rule.strokes = [paint('surface', 0.4)];
      }
      await text(s, label, { font: 'display', size: cover ? 220 : 128, color: 'surface', x: cover ? 166 : 202, y: cover ? 317 : 705, width: 1500, lh: 100, name: 'Slot/Title' });
      if (sub && cover) await text(s, sub, { font: 'body', size: 24, color: 'surface', x: 120, y: 930, name: 'Slot/Credit' });
    } else {
      s.fills = [paint('text')];
      for (const x of [54, 1866]) box(s, { name: 'Divider', x, y: 0, w: 1, h: 1080, fill: 'line' });
      const g = stack(s, 'VERTICAL', { name: 'Container', gap: 12, x: 834, y: 846, w: 966 });
      g.counterAxisAlignItems = 'MAX';
      // muted text is tuned for light pages; on the dark divider fall back to the accent when it's too faint
      const subColor = contrast(CONFIG.roles.textMuted.hex, CONFIG.roles.text.hex) >= 3 ? 'textMuted' : 'accent';
      await text(g, sub || 'Brand Guidelines', { font: 'body', size: 28, color: subColor, upper: true, tracking: 20, name: 'Subtitle' });
      await text(g, label, { font: 'display', size: 76, color: 'surface', name: 'Title' });
    }
    return s;
  }

  // Color swatch tile (shell-aware proportions). o: { name, hex, x, y, w, h, extra:[lines], numberLabel }
  async function swatch(parent, o) {
    const onDark = contrast(o.hex, '#FFFFFF') >= contrast(o.hex, '#111111');
    // no clipping: overflow must stay visible so validateLayout can report it
    const tile = box(parent, { name: 'Swatch/' + o.name, x: o.x, y: o.y, w: o.w, h: o.h, fill: o.hex, radius: CONFIG.shell === 'card' ? (CONFIG.radius || 20) : CONFIG.shell === 'running' ? 32 : 0, stroke: contrast(o.hex, CONFIG.roles.surfaceAlt.hex) < 1.3 ? 'line' : null });
    const fg = onDark ? '#FFFFFF' : '#111111';
    const lines = [o.name, o.hex.toUpperCase(), rgbStr(o.hex), ...(o.extra || [])];
    const bottom = CONFIG.shell === 'card';
    const px = CONFIG.shell === 'running' && o.w > 200 ? 33 : 20;
    const avail = o.w - px * 2;
    const stackL = stack(tile, 'VERTICAL', { name: 'Labels', gap: 4, x: px, y: 0 });
    if (o.numberLabel) await text(stackL, o.numberLabel, { font: 'body', size: 40, color: fg, fit: avail, minSize: 24 });
    // labels shrink (15 -> 12px) before they wrap, so narrow tiles (5+ per row) keep one value per line
    for (const [i, l] of lines.entries()) await text(stackL, l, { font: i === 0 && !o.numberLabel ? 'body' : 'mono', size: 15, color: fg, fit: avail });
    stackL.y = bottom ? o.h - 20 - stackL.height : 30;
    return tile;
  }

  const report = () => ({ fontSubstitutions: subs, todos, unboundRoles: unbound });

  return { init, font, paint, gradient, text, fit, grid, box, stack, todo, contentPage, divider, swatch, contrast, rgbStr, cmykApprox, report, rgb };
})();
