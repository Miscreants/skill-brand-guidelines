// READ-ONLY token extraction for use_figma. Paste as the `code` body after editing the constants.
// Run PART='variables' and PART='styles' in parallel, then PART='assets' / 'scan' once per page (one page per call).
// Output is kept compact to stay under the 20 KB return limit; lower LIMIT / raise OFFSET to page through.

const PART = 'variables';      // 'variables' | 'styles' | 'assets' | 'scan'
const PAGE_ID = null;          // required for 'assets' and 'scan' (e.g. '1:5')
const LIMIT = 250;             // max items returned per list
const OFFSET = 0;

const hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const lh = l => !l || l.unit === 'AUTO' ? 'auto' : l.unit === 'PERCENT' ? Math.round(l.value) + '%' : Math.round(l.value) + 'px';
const ls = l => !l || !l.value ? 0 : l.unit === 'PERCENT' ? +(l.value).toFixed(2) + '%' : +(l.value).toFixed(2) + 'px';
const paintOut = p => p.type === 'SOLID' ? { t: 'solid', hex: hex(p.color), o: p.opacity ?? 1 }
  : p.type.startsWith('GRADIENT') ? { t: p.type.toLowerCase(), stops: p.gradientStops.map(s => hex(s.color) + '@' + Math.round(s.position * 100)) }
  : { t: p.type.toLowerCase() };

if (PART === 'variables') {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const out = [];
  let n = 0;
  for (const c of cols) {
    const vars = [];
    for (const id of c.variableIds) {
      if (n++ < OFFSET || vars.length >= LIMIT) continue;
      const v = await figma.variables.getVariableByIdAsync(id);
      if (!v) continue;
      const vals = {};
      for (const m of c.modes) {
        const val = v.valuesByMode[m.modeId];
        let s;
        if (val && val.type === 'VARIABLE_ALIAS') { const a = await figma.variables.getVariableByIdAsync(val.id); s = '->' + (a ? a.name : val.id); }
        else if (val && typeof val === 'object' && 'r' in val) s = hex(val) + (val.a < 1 ? '@' + Math.round(val.a * 100) : '');
        else s = val;
        vals[m.name] = s;
      }
      // single-mode collections: flatten to a value
      vars.push([v.name, v.resolvedType[0], c.modes.length === 1 ? Object.values(vals)[0] : vals, v.id]);
    }
    out.push({ collection: c.name, id: c.id, modes: c.modes.map(m => m.name), count: c.variableIds.length, vars });
  }
  return { part: PART, legend: '[name, type(C=color F=float S=string B=bool), value|{mode:value}, variableId]', collections: out };
}

if (PART === 'styles') {
  const paints = (await figma.getLocalPaintStylesAsync()).slice(OFFSET, OFFSET + LIMIT)
    .map(s => [s.name, s.paints.map(paintOut), s.id]);
  const texts = (await figma.getLocalTextStylesAsync()).slice(OFFSET, OFFSET + LIMIT)
    .map(s => [s.name, s.fontName.family, s.fontName.style, s.fontSize, lh(s.lineHeight), ls(s.letterSpacing), s.textCase !== 'ORIGINAL' ? s.textCase : '', s.id]);
  const effects = (await figma.getLocalEffectStylesAsync()).map(s => [s.name, s.effects.map(e => e.type).join('+'), s.id]);
  const grids = (await figma.getLocalGridStylesAsync()).map(s => [s.name, s.layoutGrids.map(g => `${g.pattern}:${g.count ?? ''}c gutter${g.gutterSize ?? ''} off${g.offset ?? ''}`).join(' | '), s.id]);
  return { part: PART, paintLegend: '[name, paints, id]', textLegend: '[name, family, style, size, lineHeight, letterSpacing, case, id]', paints, texts, effects, grids };
}

if (!PAGE_ID) throw new Error('PAGE_ID is required for assets/scan');
const page = await figma.getNodeByIdAsync(PAGE_ID);
await figma.setCurrentPageAsync(page);

if (PART === 'assets') {
  const re = /logo|logomark|wordmark|lockup|icon|mark|symbol/i;
  const comps = page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })
    .filter(n => !(n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET'));
  const frames = page.children.filter(n => (n.type === 'FRAME' || n.type === 'GROUP' || n.type === 'SECTION') && re.test(n.name));
  const fmt = n => [n.name, n.type, n.id, Math.round(n.width) + 'x' + Math.round(n.height), n.type !== 'FRAME' && n.type !== 'GROUP' && n.type !== 'SECTION' ? (n.key || '') : ''];
  return {
    part: PART, page: page.name, legend: '[name, type, id, size, componentKey]',
    components: comps.slice(OFFSET, OFFSET + LIMIT).map(fmt), componentCount: comps.length,
    topLevelMatches: frames.slice(0, 60).map(fmt),
  };
}

if (PART === 'scan') {
  // Canvas fallback for files without variables/styles: rank colors & fonts by usage, and catch "Name #HEX" labels.
  const colors = {}, fonts = {}, named = {};
  const nodes = page.findAll(n => 'fills' in n);
  for (const n of nodes) {
    if (Array.isArray(n.fills)) for (const p of n.fills) {
      if (p.visible === false) continue;
      if (p.type === 'SOLID') { const h = hex(p.color); colors[h] = (colors[h] || 0) + 1; }
      else if (p.type.startsWith('GRADIENT')) { const k = 'G:' + p.gradientStops.map(s => hex(s.color)).join('>'); colors[k] = (colors[k] || 0) + 1; }
    }
    if (n.type === 'TEXT') {
      for (const seg of n.getStyledTextSegments(['fontName', 'fontSize'])) {
        const k = `${seg.fontName.family}|${seg.fontName.style}|${seg.fontSize}`;
        fonts[k] = (fonts[k] || 0) + seg.characters.length;
      }
      // a label line ("Rad-Dark") directly followed by a hex; skips fragments of multi-hex lists
      for (const m of n.characters.matchAll(/(?:^|\n)\s*([A-Za-z][\w\- ]{1,30}?)\s*\n?\s*(#[0-9A-Fa-f]{6})\b/g)) named[m[1].trim() + ' ' + m[2].toUpperCase()] = 1;
    }
  }
  const top = (o, k) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, k);
  return { part: PART, page: page.name, colors: top(colors, 40), fonts: top(fonts, 30), namedColors: Object.keys(named).slice(0, 40) };
}

throw new Error('Unknown PART ' + PART);
