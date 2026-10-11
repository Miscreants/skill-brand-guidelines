# Token → role → page mapping

The four source files structure their tokens very differently. Detect which pattern you're looking at, then normalize.

| Brand | Variables | Paint styles | Text styles | Notes |
|---|---|---|---|---|
| Cylake | `Variable collection` (Primary/*, Tints+Shades/<Color>/<20/50/70/100%>, Neutral/*), plus `Product/*` and `Product v2/*` collections with Light/Dark modes and aliases | mirrors variables | `Headline/Regular/*`, `Headline/Italics/*`, `Paragraph/*`, `Mono/*`, `Product/*` | Brand palette and product UI tokens live in separate collections. Use the brand collection for guidelines, and offer `ui.product-tokens` for the product sets. |
| DomainTools | `Variable collection` (Neutral/Primary/Secondary), `Collection` with Light/Dark/Medium semantic aliases (Background, Text, Card, Stroke…), `Corner Radius` FLOATs | Neutral/*, Primary/*, Secondary/* | `Headings/*` + `* Highlight` variants, `Paragraph/*`, `Mobile/*`, `Mono` | The semantic collection gives the shell roles directly. Radius vars feed `ui.shapes`. |
| Rad Security | **none** | **none** | **none** | Values exist only on canvas, so use `PART='scan'` and confirm with the user. Colors are named in copy ("Rad-Dark #0C0827"), so also scan text for `Name #HEX` patterns. |
| Dropzone | **none** | `Primary/Dropzone-1CB797` (hex in name), Secondary/*, Neutral/*, Gradient/*, Print/Gradient/* | `Guidelines/*` (the deck's own styles), `Editorial/*`, `Web/Desktop/*`, `Web/Mobile/*` | Hex embedded in style names. Gradients are paint styles. |

## Palette detection

1. Prefer **variables** of type COLOR, then **paint styles**, then **canvas scan**.
2. Group by the first path segment: `Primary`, `Secondary`, `Neutral`, `Accent`, `Gradient`, `Print`… Anything that isn't a semantic name goes in the palette.
3. **Semantic vs primitive**: a variable whose value is a `VARIABLE_ALIAS`, or whose name is a role (`background`, `text/*`, `surface/*`, `border/*`, `action/*`, `status/*`), is *semantic*. It goes to the role map, not the palette page.
4. **Ramps (tints/shades)**: detect names ending in a step, e.g. `/20%`, `/50%`, `/100%`, `/100`, `/950`, `-50`, or names containing `Tint`/`Shade`. Group by parent and sort numerically. Mark the step equal to the base color as `Base`. If no ramps exist and the user selected `color.tints`, generate them by mixing with white (20/40/60/80%) and black (20/40/60/80%) and caption the page "Generated tints — confirm". DZ's convention is BASE · 100 · 70 · 50 · 20.
5. Name display: strip the group prefix and any `Brand-`/hex suffix. Show HEX uppercase, `RGB (r, g, b)`, and CMYK only if supplied (or computed and labelled "approx.").
6. Gradients: from GRADIENT_* paint styles, or `scan` finds gradient fills on big frames. List stops as hex.

## Role map (drives the shell)

| Role | Pick, in order |
|---|---|
| `bg` | semantic `background`/`surface/background`, else the lightest neutral (Editorial/Card/Running) or the darkest neutral (Sidebar dividers, dark covers) |
| `surface` | semantic `card`/`surface/card`, else white or the second-lightest neutral |
| `surfaceAlt` | `surface/muted` or a mid-light grey (DT `#D9D9D9`, RAD `#F3F3F3`, DZ `#F2F2F2`) |
| `text` | semantic `text`/`text/foreground`/`text/primary`, else the darkest neutral |
| `textMuted` | `text/muted*`/`text/secondary`, else the 50% tint of `text`, or `#626262`–`#B8B8B8` |
| `accent` | `Primary/*` first non-neutral (DT green, CY Burnt Orange, DZ teal, RAD purple) |
| `onAccent` | `text` or white, whichever has the higher contrast against `accent` |
| `line` | semantic `border`/`stroke`, else `text` at 15–20% opacity |
| `gradient` | first gradient paint style or the RAD/DZ-style gradient, if any |
| `fontDisplay` | family of the largest heading text style (`Display`, `H1`) |
| `fontBody` | family of `Paragraph/*`, `Body`, or `*-Text` styles |
| `fontMono` | family containing `Mono`, else `fontBody` |

Store role → `{ variableId | styleId | hex }` so build calls can bind to the variable when one exists.

## Type scale detection

- Group text styles by prefix: desktop (`Headings/`, `Headline/`, `Web/Desktop/`), mobile (`Mobile/`, `Web/Mobile/`), editorial/print (`Editorial/`), product (`Product*`). Each group becomes one hierarchy table (`type.hierarchy`, `type.mobile`, `type.editorial`).
- `* Highlight` / `Italics/*` variants are emphasis pairs. Show them as a second column, not as separate rows.
- Row label = last path segment. Show size, line height (% or px), weight (style name) and letter spacing if non-zero.
- `type.families`: one page per *family*. Within a family, list the weights actually used by styles. DT is the exception: it does one page per weight, which is fine when the user wants it.

## Assets

- Logo: components or frames whose name matches `/logo|logomark|wordmark|lockup/i` on a page named like Logo. Detect variants from name tokens: `primary|secondary|tertiary|horizontal|vertical|mark|white|black|mono|dark|light|print|color`.
- Icons: components on Icons pages. Take up to 40 for a grid.
- Imagery: frames on Imagery/Photo pages containing IMAGE fills.
- Cross-file placement: `figma.importComponentByKeyAsync(key)` works only for **published** library components. Otherwise put a `TODO: place logo (<variant>)` placeholder.

## Fallback checklist when data is missing

| Missing | Do |
|---|---|
| no variables/styles | `scan` + confirm the palette and fonts with the user |
| font not loadable | build-kit substitutes Inter. Keep the real family name in labels. Report it. |
| Pantone/CMYK | `⚠️ TODO` placeholders. Offer computed CMYK labelled approximate. |
| logo | Placeholder rectangle with dashed `line` stroke + `TODO:` name |
| copy | Write neutral factual copy from data; anything normative (rules, rationale) → `TODO:` |
