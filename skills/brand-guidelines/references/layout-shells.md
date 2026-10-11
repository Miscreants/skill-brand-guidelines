# Layout shells

All four agency decks use **1920×1080** frames laid out on the canvas as **one row per module**. The divider or contents slide comes first in each row, with ~70–240px horizontal gaps and ~80–600px between rows. The measurements below come from the source files. Colors are **roles** (see `token-mapping.md`) and are never hard-coded brand values.

Content-area rule shared by all shells: the title is ~58–64px in the display font, copy is 20–24px in the body font at ~140–150% line height, and labels and meta text use the mono font at 13–18px (often uppercase, tracked).

---

## A. Editorial (Cylake)

```
┌──────────────────────────────────────────────┐
│ Title (display 58)                   [mark]  │  y=100, x=100 / mark top-right x≈1828
│ copy 20/150%,                                │  left column 394px wide
│ 394px column      ┌─────────────────────┐    │
│                   │   content area      │    │  x≈681–1819, y≈213–817
│                   │   1138 × 604        │    │
│                   └─────────────────────┘    │
│ brand guidelines (mono 13)              P11  │  footer bar y=979 h=36, pad 100
└──────────────────────────────────────────────┘
```
- Margin 100. Background `bg` (paper tone). Text is `text`, and meta text uses `accent`/`textMuted`.
- Footer: auto-layout horizontal, `pad 100/8`, two mono texts (lowercase brand-guidelines label left, `P##` page right).
- Logomark ~27×30 at top-right (x=1828, y=62).
- **Cover**: logo lockup 394px wide at (100,104); "Brand Guidelines" display at 200px at (100,650); "Designed by" + agency logo at (100,941).
- **Divider**: use the contents slide with the active module at 100% and the others at ~25% (display 100px list, mono `0N.` index).

## B. Card Grid (DomainTools)

```
┌──────────────────────────────────────────────┐
│ [logo]                     (02. COLOR)(V 1.0)│  top bar h=68, bg=surface
├──────────────────────────────────────────────┤
│ ┌────┐┌────┐┌────┐┌────┐┌────┐               │  content x=67…1853, y=108
│ │card││card││card││card││card│  r20 pad20    │
│ └────┘└────┘└────┘└────┘└────┘               │
│ ┌───────────────────────┐                    │
│ │ (→) Title             │  info card 735×210 │  y≈803, r20, pad20
│ │ copy                  │                    │
│ └───────────────────────┘                    │
└──────────────────────────────────────────────┘
```
- Background `surfaceAlt` (mid grey), cards `surface` with a 1px `line` stroke, radius 20 (use radius variables if they exist).
- Top bar: 1920×68 `surface`, logo at (67,18) height 33, two **pills** at the right edge (h35, r90, fill `accent`, text `onAccent`, regular 18 uppercase): section `0N. MODULE` and `VERSION 1.0`. The right pill ends at x=1852.
- Info card: an arrow icon in an `accent` circle, then a title (display 40-ish semibold) and copy.
- **Divider / Cover**: a full-bleed square grid (105px cells, 1px `text` stroke) over `surface`. Then a big label card (r40, pad 46/31) with an offset hard shadow (`text` color, offset 12/12, no blur), containing `01. Logo` in display ExtraBold 160. Cover: "Brand Guidelines" in the same card style at (152,363), plus a CTA pill bottom-right.

## C. Running Header (Rad Security)

```
┌──────────────────────────────────────────────┐
│ Version 1.0         Rad Security        2025 │  y=47, 24px, textMuted
│                                              │
│ Title (64)            ┌──┐┌──┐┌──┐┌──┐       │  title (120,142)
│                       │  ││  ││  ││  │ r32   │  visual block x≈850–1800
│ copy 24 (x120,        └──┘└──┘└──┘└──┘       │
│  w≈630)               ┌─────┐┌──┐┌──┐        │
│ ──────────────────────────────────────────── │  rule y=960, x 122→1800
│                     03 / Color       Page 07 │  y=1003
└──────────────────────────────────────────────┘
```
- Margin 120. Background `surfaceAlt` (light grey) on content pages. The header and footer are plain text nodes in three columns (left x=120, center ~x=844–893, right-aligned ending at x=1800), 24px body font in `textMuted`.
- The left column holds title + copy. The right ~950px holds the visual proof. Tiles use r32 (or the brand radius) with labels inside at pad 33.
- **Divider**: full-bleed `bg` dark gradient with a 36px vertical **gradient strip** on the left edge (the brand gradient). `0N.Module` at 128px at (202,705), and header/footer text in white.
- **Cover**: a gradient card inset 36px with r24, "Brand Guidelines" at 220px, and "Designed by" + agency mark bottom-left.

## D. Sidebar (Dropzone)

```
┌──────────────────────────────────────────────┐
│ COLOR (mono 18)                  DROPZONE.AI │  header h=102 pad120/40
├────────────────┬─────────────────────────────┤
│ Sidebar Title  │                             │
│ (display 32)   │   content x≈700–1800        │
│ Sidebar desc   │                             │
│ (body 24)      │                             │
│  667 wide,     │                             │
│  surfaceAlt    │                             │
├────────────────┴─────────────────────────────┤
│ BRAND GUIDELINES (mono 18)           2025 v2 │  footer h=102 pad120/40
└──────────────────────────────────────────────┘
```
- Header and footer: 1920×102 auto-layout `pad 120/40` with `SPACE_BETWEEN` and mono 18 in `textMuted`, uppercase and tracked. Header: module (left), brand domain (right). Footer: "BRAND GUIDELINES" (left), year + version (right). Header has a 1px `line` bottom border.
- Sidebar: 667×876 starting at y=102, auto-layout vertical `pad 120/40 gap 20`, fill `surfaceAlt`.
- **Layer names are template slots**: `Header Title`, `Header Text Right`, `Footer Text Left`, `Footer Text Right`, `Sidebar Title`, `Sidebar Description`, `Label`. Keep these names. They make later bulk edits easy, and every shell should name its slots this way.
- **Divider / Cover**: dark `bg`, four 54px "Divider" bars framing the edges (subtle `line`), full logo at (120,120) height 111, and bottom-right a group with a mono/body subtitle (`BRAND GUIDELINES` / year, 28px, `textMuted`) above the title (display 76).

---

## Slot naming (all shells)

Name every generated node by role so a later run can find and update it:
`Slide/<page-id>` (frame), `Chrome/Header`, `Chrome/Footer`, `Slot/Title`, `Slot/Copy`, `Slot/Visual`, `Slot/PageNumber`, `Slot/Section`, and `TODO: <what's needed>` for placeholders.

## ASCII previews for AskUserQuestion

Use the four diagrams above, trimmed to ~12 lines, as the `preview` value of each shell option.
