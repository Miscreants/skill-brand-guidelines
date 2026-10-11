# Module & page catalog

This catalog is distilled from the four agency decks: Cylake (CY), DomainTools (DT), Rad Security (RAD) and Dropzone (DZ). Each page has:
- `id`: stable key stored in `brand-config.json`
- **Seen in**: which reference decks have this page (screenshot them via `source-decks.md` for layout ideas)
- **Data**: where the content comes from. ✅ tokens · 🖼 asset · ✍️ copy · ⚠️ value the user must supply
- **Layout**: the recipe inside the shell's content area

Every content page follows the same reading order in all four decks: **title → 1–3 short paragraphs → the visual proof (swatches, specimens, logo, examples)**. The shell decides where title and copy sit (left column, sidebar or card). See `layout-shells.md`.

---

## Presets

| Preset | Pages |
|---|---|
| **Lite** (DZ "Lite" / one-pager) | cover · logo.overview · logo.clearspace · logo.misuse · color.palette · type.families · type.hierarchy · thanks |
| **Core** (≈ RAD) | cover · contents · dividers · logo.overview · logo.variants · logo.clearspace · logo.misuse · color.palette · color.tints · color.print · type.families · type.hierarchy · icons.library · imagery.overview · thanks |
| **Full** (≈ CY + DZ) | everything below for which data exists. Skip pages whose data status would be all-TODO and list them in the report. |
| **Custom** | user picks modules (Call B) and optionally pages (Call C) |

---

## Structural (navigation)

| id | Page | Seen in | Data | Layout |
|---|---|---|---|---|
| `cover` | Cover: "Brand Guidelines", logo, Designed by, version/year | all | ✅ logo 🖼 agency mark | Shell cover |
| `contents` | Contents: numbered module list | CY (repeated before each section with the active one highlighted) | ✅ selected modules | Big display-font list, `01.` mono index. Inactive items use `textMuted` at about 25% opacity. **CY pattern**: duplicate the contents slide as each section divider, highlighting the current module. |
| `divider` | Section divider: `0N. Module` | DT, RAD, DZ | ✅ | Shell divider |
| `thanks` | Thank you / back cover | CY, DT | ✅ | Mirror of cover |

## 01 Logo (`logo`)

| id | Page | Seen in | Data | Layout |
|---|---|---|---|---|
| `logo.overview` | Logo intro: the primary lockup large, one-paragraph rationale | all | 🖼 logo ✍️ | Title + copy left; logo centered in content area at about 60% width |
| `logo.construction` | Components: logomark + wordmark labelled; primary/secondary/tertiary lockups | CY, DT, DZ | 🖼 lockups | 2–3 equal tiles, mono labels above (`PRIMARY LOGO`, `LOGOMARK`, `WORDMARK`) |
| `logo.clearspace` | Clear space "x" + minimum size | all | 🖼 ✍️ rule (e.g. x = ½ logomark, x = 1/3 logo height, x = wordmark "o") | Logo with dashed `line` boxes of size x on all sides, `X` labels, `X INDICATOR` legend |
| `logo.variants` | Color variants: full color / mono dark / mono light (on light + dark bg) | all | 🖼 variants ✅ bg colors | 2×2 or 2×3 tiles alternating `bg`/`text` surfaces, captions `DARK MODE` / `LIGHT MODE` |
| `logo.print` | Print logo colors (CMYK / Pantone versions) | DZ, CY | 🖼 ⚠️ CMYK/Pantone | Variant tiles + spec captions |
| `logo.scale` | Scale & minimum size (horizontal vs vertical, logomark-only below N px) | DZ | 🖼 ⚠️ px thresholds | Row of decreasing sizes with px labels |
| `logo.misuse` | Don'ts: stretch, recolor, rotate, crop, rearrange, busy bg, outline, effects | all | 🖼 logo ✍️ (default list below) | 3×2 grid of tiles, each logo transformed + caption, ✕ marker in `accent` |
| `logo.guidance` | General usage rules (bullets) | RAD, DZ, CY | ✍️ | Copy-heavy page |

Default misuse captions. Adapt them to the brand voice; DT's voice is witty, RAD's is plain:
stretch/distort · change colors · rotate/tilt · crop/mask · rearrange mark & wordmark · busy/low-contrast background · add outline · add effects/shadows.
Build the transformed tiles from logo instances. Use `resize` non-uniformly for stretch, `rotation` for rotate, recolored fills for recolor, a clipped frame for crop, and swapped child order for rearrange.

## 02 Color (`color`)

| id | Page | Seen in | Data | Layout |
|---|---|---|---|---|
| `color.palette` | Core palette: name, HEX, RGB (and CMYK if known) | all | ✅ | **Card Grid**: tall cards, number + hex at the bottom. **Running Header**: rounded tiles in a 2-row bento. **Sidebar**: rows. **Editorial**: wide flat chips |
| `color.roles` | Color roles & usage / proportion (e.g. 60/30/10 bar) | CY (draft) | ✅ + ✍️ | Proportion bar + role list (bg, text, accent, CTA) |
| `color.neutrals` | Neutral palette | DZ | ✅ | Same as palette |
| `color.tints` | Tints + shades table | CY, DT, RAD, DZ | ✅ ramps (see token-mapping) | Table: rows = steps (20/50/base/70/100), columns = colors; or rows = colors with steps as chips |
| `color.gradients` | Gradient palette + stops | RAD, DZ | ✅ gradient paint styles | Large swatches with stop hexes listed |
| `color.gradient-use` | Gradient applications (logo fill, heading highlight, strokes, lighting) | DZ | 🖼 ✍️ | 2×3 example tiles |
| `color.mesh` | Mesh gradients & effects | DZ, RAD (gradient patterns) | 🖼 | Full-bleed image tiles |
| `color.print` | Pantone / CMYK | CY, DT, RAD, DZ | ⚠️ never invent Pantone. CMYK can be computed but must be labelled "approx." | Same tiles as palette, with print codes |
| `color.print-gradients` | Print gradients (add grain/noise to avoid banding) | DZ | ⚠️ ✍️ | Swatches + note |
| `color.a11y` | Accessibility / contrast matrix | CY | ✅ (computed WCAG ratio) | Grid: fg colors × {light bg, dark bg} with ratio + AA/AAA badges (`build-kit` `contrast()`) |

## 03 Typography (`type`)

| id | Page | Seen in | Data | Layout |
|---|---|---|---|---|
| `type.overview` | Pairing intro + live headline example ("eyebrow / H1 / body / CTA") | CY, DT | ✅ fonts ✍️ sample copy | Composed hero sample using real text styles |
| `type.families` | One page per family/weight: big "Aa", name, role tags (Display · Headings · Body · Eyebrows), glyph set, pangram | CY, DT, DZ | ✅ | "Aa" at ~400px left; name + role pills + copy right; glyph block below. DT uses a security pangram: "Jovial hackers breach complex firewalls…" |
| `type.weights` | Prioritised styles (which weights are used) | DZ | ✅ | Weight ladder |
| `type.hierarchy` | Desktop type scale table: name, size, line height, weight | all | ✅ text styles | Table rows rendered *in* each style: `Display 120px`, `H1 96px`… |
| `type.mobile` | Mobile type scale | DZ, DT (Mobile/* styles) | ✅ | Same table |
| `type.editorial` | Print/editorial scale (pt) | DZ | ✅ `Editorial/*` styles | Same table |
| `type.fallback` | Fallback fonts (Google Docs / system) | DZ (Montserrat + Maven Pro) | ⚠️ | Side-by-side spec |

## 04 Iconography (`icons`)

| id | Page | Seen in | Data | Layout |
|---|---|---|---|---|
| `icons.library` | Library used (Material Symbols / Carbon / Lucide), stroke, color rule | DT, RAD, CY, DZ | 🖼 icon components ✍️ library name | Grid of 24–40 icons |
| `icons.sizes` | Size steps (16/24/32/48/80) | DT | ✅ | Same icon at each size with labels |
| `icons.custom` | Custom/brand icons (L2 grid 192px, 4px stroke) | RAD, DZ | 🖼 | Large icons on a keyline grid |
| `icons.levels` | L1 / L2 / L3 icon system | DZ | 🖼 ✍️ | 3 columns |

## 05 Illustration & Diagrams (`illustration`)

| id | Page | Seen in | Data | Layout |
|---|---|---|---|---|
| `illustration.style` | Illustration style intro | DT | 🖼 ✍️ | Copy + hero illustration |
| `illustration.diagram` | Diagram system: components, base layers, assembled example | CY (4 pages) | 🖼 | Component sheet + example |
| `illustration.platform` | Platform/UI illustrations & mock UI kit | DZ, DT | 🖼 | Product mock framed in a card |
| `illustration.infographics` | Infographics rules | DZ | 🖼 ✍️ | Examples |

## 06 Imagery & Photography (`imagery`)

| id | Page | Seen in | Data | Layout |
|---|---|---|---|---|
| `imagery.overview` | Photo direction | CY, RAD (7 pages, image-only) | 🖼 | Copy + 3–4 image mosaic |
| `imagery.treatment` | Image treatment steps (e.g. grayscale → duotone → grain) | CY | 🖼 ✍️ | 3-step before/after row |
| `imagery.product` | Product/hardware photography | CY | 🖼 | Hero + examples |
| `imagery.ai-prompts` | AI image prompts (Nano Banana / Midjourney): anchor, fixed sections, variable sections | CY, DZ | ✍️ | Prompt in mono, sectioned `[01] [02]…`, example outputs |
| `imagery.gallery` | Example gallery | RAD | 🖼 | Full-bleed / 2-up images |

## 07 Patterns & Texture (`texture`)

| id | Page | Seen in | Data | Layout |
|---|---|---|---|---|
| `texture.patterns` | Primary/secondary patterns (honeycomb, frames & lines, square grid, pixel grid, halftone) | DZ | 🖼 | One page per pattern: swatch + usage |
| `texture.paper` | Paper/grain texture | CY | 🖼 | Texture swatch + in-use |
| `texture.gradient-patterns` | SVG gradient background shapes | RAD | 🖼 | Gallery |

## 08 Shapes & UI (`ui`)

| id | Page | Seen in | Data | Layout |
|---|---|---|---|---|
| `ui.shapes` | Corner radius, stroke weights | RAD, DT | ✅ FLOAT vars (radius) | Boxes showing each radius with px labels |
| `ui.buttons` | Buttons / CTAs | DT | 🖼 button components | Instances in states |
| `ui.product-tokens` | Product UI tokens (surface/text/border/status/chart) | CY (Product/* collections) | ✅ | Token table by group, both modes side-by-side |

## 09 Voice & Tone (`voice`)

| id | Page | Seen in | Data | Layout |
|---|---|---|---|---|
| `voice.statement` | Brand voice statement | CY | ✍️ | Large pull-quote style |
| `voice.behaviors` | 3 behaviors (01/02/03) | CY | ✍️ | 3 columns, mono numbers |
| `voice.register` | Do's & don'ts / register examples | CY | ✍️ | Numbered list with example quotes |

These pages are all copy. Ask the user for source material. Don't generate brand claims.

## 10 Layout & Grids (`layout`)

| id | Page | Seen in | Data | Layout |
|---|---|---|---|---|
| `layout.desktop` | Desktop grid (frame size, columns, margin, gutter) | DZ | ⚠️ or read from a layout grid style | Mini frame illustration + spec table |
| `layout.mobile` | Mobile grid | DZ | ⚠️ | Same |
| `layout.editorial` | Print/document grids | DZ | ⚠️ | Same |

## 11 Brand in Action (`applications`)

| id | Page | Seen in | Data | Layout |
|---|---|---|---|---|
| `applications.intro` | Brand in action intro | CY | ✍️ | Copy + hero |
| `applications.examples` | Example layouts (web, social, ads, events) | CY (4), DZ | 🖼 frames from other pages of the file | Clone/instance frames scaled into a 2-up or full-bleed slide |
| `applications.stationery` | Business cards (size, bleed, safe area) | DZ | 🖼 ⚠️ | Card front/back + spec |
| `applications.motion` | Motion style | DZ (WIP) | ✍️ | Placeholder page |
