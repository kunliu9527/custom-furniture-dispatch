# DESIGN.md — custom-furniture-dispatch

Design language for this product. Agents must follow this file together with:

- `.cursor/skills/baseline-ui/SKILL.md` ([ibelick/ui-skills](https://github.com/ibelick/ui-skills) baseline)
- `.cursor/skills/apple-hig-ui/SKILL.md`
- `src/styles/apple-hig-tokens.css`

## Intent

Quiet **system tool** UI (派单 / 量尺 / 评价), Apple HIG–inspired, **not** a marketing landing page and **not** purple SaaS slop.

## Colors

- Accent: `--system-blue` / `--color-accent` only for primary actions and key links.
- Status: `--system-green` / `--system-orange` / `--system-red`.
- Text: `--label-primary` / `--label-secondary` / `--label-tertiary`.
- Surfaces: page `--bg-grouped-primary` (#f2f2f7), work surface white + opaque border.
- Separators: opaque `--separator` (`#d1d1d6`) / `--separator-opaque` — hard edges, not translucent mush.
- **Do not** use indigo/violet brand gradients, mesh glows, or brand-tinted shadows (legacy `--vi-brand` purple is deprecated for new UI).

## Typography

- UI: `--font-system` (system + PingFang SC).
- Data: `tabular-nums`.
- Headings: semibold/medium, tight hierarchy; body stays readable at `--text-subhead` / `--text-callout` scale for dense boards.

## Elevation & motion

- **Static panels: no shadow** — opaque border only.
- **Controls (buttons / chips / active tabs): may use `--shadow-control`** so they read as clickable; no colored glow.
- Shadows for floating layers (popover / modal / dropdown): `--shadow-md`.
- Header is **solid white** + bottom opaque hairline (no frosted glass).
- Motion only when requested; durations ≤ `--duration-normal`; respect reduced motion.

## Layout & shape

- Spacing snaps to 8pt (`--space-*`).
- Radius: surfaces **6–8px** (`--radius-md` / `--radius-card`); buttons `--radius-button` 6px.
- Prefer **one work surface** + internal hairlines over stacked soft cards.
- Segmented controls OK; avoid clusters of `rounded-full` chips as the main chrome.

## Components (patterns)

- **Shell**: solid white header + opaque bottom line; one hard work surface per board.
- **Primary button**: solid system/board blue (or board accent), white label, visible border + light control shadow.
- **Secondary**: white fill + strong gray border; hover shows accent edge.
- **Filter chip / nav active**: **solid accent fill + white text** (not pale tint).
- **Segmented**: gray track; active segment solid accent + white.
- **Empty state**: one sentence + one action.
- **Destructive**: confirm first.

## z-index

Use `--z-sticky` … `--z-toast` from tokens. Do not invent new arbitrary layers without updating tokens.

## Do / Don’t

**Do**

- Reuse existing React structure; restyle with tokens.
- Limit one accent color per view.
- Keep touch targets ≥ `--touch-min` on mobile.

**Don’t**

- Purple/multicolor gradients or mesh backgrounds for new work.
- Glow, neon, multi-layer colored shadows.
- Generate a parallel component library “because Apple”.
- Animate layout properties or large blurs.

## Migration note

Legacy VI class names (`vi-*`) remain but tokens now map to HIG system blue / grouped surfaces. **No purple brand gradients.**

Done:
- Phase 1 shell + home ticket desk
- Deslop indigo/violet across boards
- **Hard surfaces pass**: opaque borders, 6–8px radius, no static shadows, solid header, KPI/todos as single divided panels

Next optional: unify deep workbench content into fewer nested cards.
