---
name: brand-guidelines
argument-hint: <figma-file-url> [brand name]
description: Build an agency-style brand guidelines deck (1920x1080 slides) in Figma from a brand's Figma variables, styles and logo assets. Walks the user through picking a layout shell, a preset or individual modules/pages (logo, color, typography, iconography, imagery, illustration, patterns, voice & tone, layout grids, brand in action...), then generates the slides bound to the brand's tokens. Use when the user asks to create, generate, scaffold, extend or refresh brand guidelines / a brand book / a style guide deck in Figma, or shares a Figma file and asks for guidelines from its styles.
---

# Brand Guidelines Builder

Generates a brand guidelines deck in Figma that follows the agency's house structure (as seen in the Cylake, DomainTools, Rad Security and Dropzone decks), filled from the brand's own Figma **variables, color/text/effect styles and logo components**.

The skill is interactive. The user picks a **layout shell** and the **modules/pages** they want, and Claude builds only those.

## Before you start

1. Load `figma:figma-use` (mandatory before any `use_figma` call). Pass `skillNames: "figma-use"` on every call.
2. Read these references as you reach the step that needs them, not all up front:
   - `references/modules.md`: module and page catalog, the presets, what each page needs.
   - `references/layout-shells.md`: the four measured page-chrome archetypes.
   - `references/token-mapping.md`: how variables and styles map to roles and pages, plus fallbacks.
   - `references/source-decks.md`: the four reference decks, with node IDs to screenshot for inspiration.
   - `scripts/extract-tokens.js`: read-only extraction script for `use_figma`.
   - `scripts/build-kit.js`: helper functions to prepend to every build call.
   - `scripts/validate-layout.js`: `validateLayout()`, the layout gate. Paste it after the kit in every build call.
3. Keep workflow state in `brand-guidelines/<brand-slug>/brand-config.json` in the working directory, not in the Figma file. Re-read it on resume. The shape is in `references/brand-config.example.json`.
4. `build-kit.js` covers chrome, dividers and swatches for all four shells. Other page recipes are composed by you from its primitives (`contentPage`, `divider`, `swatch`, `text`, `fit`, `box`, `stack`, `todo`, `contrast`, `cmykApprox`). `validateLayout()` is what proves a page is correct. A screenshot does not.

## Workflow

When invoked as `/brand-guidelines <figma-url> [brand name]`, take the URL and name from the arguments. If there are no arguments, ask for the Figma URL first. If `brand-guidelines/<slug>/brand-config.json` already exists for that file, offer to resume or extend it instead of starting over.

### Step 1 — Intake (ask only what you can't infer)

You need:
- **Source Figma URL**: the file holding the brand's variables, styles and logo. Parse `fileKey` (and `node-id` if given).
- **Target**: a new page in the source file (default) or another file the user names. Never write into a page that already has content. Create a new page named `Brand Guidelines (generated)`, or append ` v2`, ` v3`… if it exists.
- Brand name, version label (default `Version 1.0`), year (default current year), "Designed by" credit (default: the agency).

### Step 2 — Extract tokens (read-only)

1. `get_metadata` with no nodeId lists the pages. Find pages named like Logo, Icons, Style Guide, Components, Imagery.
2. Run `scripts/extract-tokens.js` through `use_figma` with `PART = 'variables'`, then `'styles'`, in parallel. Each part stays under the 20 KB return limit. If a part still overflows, set `LIMIT` lower and page through.
3. Run `PART = 'assets'` once per candidate page (Logo / Icons pages), in parallel, one call per page. It finds logo, logomark, wordmark and icon components or frames.
4. If the file has **no variables and no styles** (Rad Security is like this), run `PART = 'scan'` on the page the user points to. It ranks the solid colors and font families actually used on the canvas. Present them for confirmation and don't assume.
5. Build the **role map** (see `references/token-mapping.md`): `bg`, `surface`, `text`, `textMuted`, `accent`, `onAccent`, `line`, plus `fontDisplay`, `fontBody`, `fontMono`. Show it to the user as a compact table and let them correct it.
6. Write everything to `brand-config.json`.

### Step 3 — Pick shell, preset and modules (the guided part)

Use `AskUserQuestion`. It allows at most 4 questions per call and 2–4 options per question, and the user can always type "Other".

**Call A (setup), up to 3 questions:**
- **Shell**, single-select, with `preview` ASCII mockups taken from `references/layout-shells.md`:
  `Editorial` (Cylake), `Card Grid` (DomainTools), `Running Header` (Rad), `Sidebar` (Dropzone). Recommend the one whose mood fits the brand's tokens. A serif display font or paper tone suggests Editorial. A neon accent with heavy rounding suggests Card Grid. Gradients on dark suggest Running Header. A dark UI with mono labels suggests Sidebar.
- **Scope preset**, single-select: `Core` (Recommended), `Lite`, `Full`, `Custom`. The definitions are in `modules.md`.
- **Navigation**, multi-select: `Contents page`, `Section dividers`, `Thank-you / back cover`.

**Call B (modules)**, only if the preset is `Custom` or the user wants to adjust. Use three multi-select questions grouped as in `modules.md`:
- Foundations: Logo · Color · Typography · Iconography
- Visual language: Imagery & Photography · Illustration & Diagrams · Patterns & Texture · Shapes & UI
- Application: Voice & Tone · Layout & Grids · Brand in Action · Print & Stationery

**Call C (pages per module)**, optional. For modules with many pages (Logo, Color, Typography), offer a multi-select of their pages, at most 4 modules per call. Skip this when a preset was chosen and the user didn't ask to fine-tune.

Then **show the outline** as a numbered page list. For each page, show its data status:
`✅ from tokens`, `🖼 needs asset`, `✍️ needs copy`, `⚠️ needs value (Pantone, CMYK…)`.
Ask one free-text follow-up if anything blocking is missing, such as the logo component or brand copy. Otherwise proceed. Missing items become visible placeholders, so they never block the build.

### Step 4 — Build

Follow `figma-use` rules. The order is:
1. **Skeleton call**: create the target page and all slide frames (1920×1080, 80px row gap, one row per module, divider first in each row, as in the reference decks), set `placeholder = true` on each, and return the frame IDs. Save them to `brand-config.json`.
2. **Chrome + structural slides**: cover, contents, dividers, thank-you, using the shell's chrome function from `build-kit.js`.
3. **One `use_figma` call per module.** Prepend `build-kit.js`, set the `CONFIG` literal from `brand-config.json`, then build that module's pages. Bind colors to variables (`setBoundVariableForPaint`) and text to text styles (`setTextStyleIdAsync`) whenever the source token exists in the target file. Otherwise use raw values and note it.
   - Logo assets: if the target is the source file, place **instances** of the logo components (or clones of the frames). Cross-file, use `importComponentByKeyAsync` for published components. Otherwise use a labeled placeholder rectangle.
   - Copy: write short, factual guideline copy derived from the tokens, such as "Our palette pairs X with Y" or "DM Sans for headings, DM Mono for labels". If the brand has a Voice & Tone page or the user supplied copy, match it. Put anything you can't know in a placeholder text node whose name starts with `TODO:`. Never invent Pantone/CMYK codes, usage rules or brand claims.
4. **Validate & fix loop (mandatory, every module).** See the section below. A module is done only when `layout.errorCount === 0`.
5. **Screenshot** once per module after validation passes, at `scale: 0.5` or larger, to judge composition (balance, hierarchy, brand feel). Small screenshots hide overflow, so never use a screenshot as the overflow check.
6. Set `placeholder = false` only on slides that passed validation.

### Validate & fix loop

Every build call ends with:
```js
return { created, ...kit.report(), layout: await validateLayout(builtSlideIds) };
```
`validateLayout` measures rendered glyph bounds, so it sees overflow even when a frame clips it. It returns `[slide, node, kind, detail, nodeId]` rows:

| kind | Meaning | Fix (in this order) |
|---|---|---|
| `overflow` | Text extends past its tile/card/pill (`past 'Swatch/Green' r+15`) | 1. `kit.fit(node, availWidth)` (shrinks to ≥12px, then wraps). 2. Rebuild the row with `kit.grid()` at a larger `minW` (fewer columns, more rows, as RAD's bento does). 3. Shorten the label (move the `RGB` line to a table). |
| `clipped` | A clipping ancestor cuts the text off | Same fixes. Never "fix" overflow by turning clipping on. |
| `word-overflow` | A single word or token is wider than its fixed-width box | `fit()` the node, or widen the box |
| `text-collision` | Two text boxes overlap (title into copy, label into label) | Re-stack inside an auto-layout `stack()`, or move the lower node below `upper.y + upper.height + gap` |
| `off-slide` | Text is outside 1920×1080 | Reflow the content box. If it can't fit, split the page into two slides (e.g. `color.tints` 1/2 and 2/2). |
| `clipped-height` | A fixed-height text box is shorter than its glyphs | Set `textAutoResize = 'HEIGHT'` |

Warnings (`tight` = closer than 8px to the container edge, `wrapped-label` = a short value like `RGB (17, 17, 17)` broken over two lines, `tiny-text` < 11px, `low-contrast` < 3:1 on a solid fill, shape `off-slide`) don't block, but fix them when cheap. For `wrapped-label`, re-grid with a larger `minW`. If a warning is intentional, such as a full-bleed image, say so in the report.

Loop: build → read `layout.errors` → targeted fix call (only the listed nodeIds, plus `validateLayout` again) → repeat. Stop after 3 rounds on the same node. Then flag it in the report with the remaining error rather than looping.

**Before declaring the deck done**, run `validateLayout(null, { pageId })` once over the whole generated page. This catches anything a later call shifted, such as an updated contents slide.

### Step 5 — Report

Finish with:
- A link to the generated page, plus the slide count per module.
- A list of every `TODO:` placeholder (slide → what's needed).
- Tokens that couldn't be bound (raw values used) and why.

## Rules of thumb

- **Read before write.** Never modify existing slides in reference decks or source pages. Only add a new page.
- **Never hide overflow.** Don't set `clipsContent` on tiles, cards or pills. `kit.stack()` turns clipping off because auto-layout frames clip by default. Labels in fixed-size containers use `text(..., { fit: availWidth })`. Paragraphs use `width`.
- **Don't shrink components that contain text.** `rescale()` on an instance scales its text too. A full-width button squeezed to fit ends up with ~7px labels. Place UI components at natural size and give wide variants their own row. Only scale artwork such as logos and icons. The validator flags `tiny-text` inside instances.
- **Text-style binding needs the font.** When a family can't be loaded (e.g. Neue Montreal in the plugin runtime), ask the user (Inter stand-in vs pause). Name stand-in nodes after their style, and put a visible `TODO:` on the specimen page so nobody mistakes the stand-in for the brand font.
- **Size from content, not assumptions.** Lay out repeated tiles with `kit.grid(n, contentBox, { minW })`. It drops to more rows instead of shrinking tiles below `minW` (default 180px, which fits an RGB label on one line). Don't hand-compute `contentW / n`.
- Font loading: brand fonts (PP Editorial New, PP Telegraf, Neue Haas Unica…) may not be available to the plugin. `build-kit.js` `font()` falls back to Inter and records the substitution. Report it.
- Keep each `use_figma` return small: IDs, counts and the TODO list only.
- When the user later asks to "add a module" or "add a page", load `brand-config.json`, append the new slides to the same page (to the right of the module's row, or as a new row), and update the contents slide.
