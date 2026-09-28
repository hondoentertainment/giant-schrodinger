# Venn with Friends — Google UX · Senior pass

**Product:** giant-schrodinger  
**Date:** 2026-09-27 (PT)  
**Figma file:** https://www.figma.com/design/P77bczKeYHAALegVLIpXzX  
**New page:** Google UX · Senior pass  
**Page node:** `4:2` → https://www.figma.com/design/P77bczKeYHAALegVLIpXzX?node-id=4-2  
**Source page preserved:** Redesign v2 (`0:1`)

Weave / Figma AI remains unlinked — this pass was built with `user-figma` `use_figma` (Plugin API) + screenshots.

---

## Frame node IDs & URLs

| Frame | Size | Node ID | URL |
|-------|------|---------|-----|
| Notes · Google UX decisions | ~480×720 | `4:3` | https://www.figma.com/design/P77bczKeYHAALegVLIpXzX?node-id=4-3 |
| Create Profile | 390×844 | `4:30` | https://www.figma.com/design/P77bczKeYHAALegVLIpXzX?node-id=4-30 |
| Lobby / Returned | 390×844 | `4:75` | https://www.figma.com/design/P77bczKeYHAALegVLIpXzX?node-id=4-75 |
| Round / Write | 390×844 | `4:113` | https://www.figma.com/design/P77bczKeYHAALegVLIpXzX?node-id=4-113 |
| Reveal / Score | 390×844 | `4:141` | https://www.figma.com/design/P77bczKeYHAALegVLIpXzX?node-id=4-141 |
| Desktop / Create Profile | 1440×900 | `4:169` | https://www.figma.com/design/P77bczKeYHAALegVLIpXzX?node-id=4-169 |

Screenshots (local): `/workspace/venn-google-ux/google-pass/`

- `create-profile.png`
- `lobby.png`
- `round.png`
- `reveal.png`
- `desktop-create-profile.png`
- `notes.png`

---

## Design intent (Google senior UX / Material You craft)

Not an Android Settings clone. Calm product craft:

- Tonal dark surfaces (surface / surface-container layers), not flat black + neon outlines.
- 8dp rhythm; generous vertical spacing; **one primary CTA** per screen.
- Sentence-case labels; quiet overlines only when useful (e.g. “Daily pair”, “Nice hit”).
- Cards 20–28px radius; pills fully rounded for primary/secondary buttons and chips.
- Primary = filled accent; secondary = tonal / outlined — never two equal-weight full-width buttons.
- AA+ contrast, ≥44px taps (avatars 48), body ≥16.

Preserve product copy/flows: Play today’s pair, Join Lobby / friends room, Lock it in, Next round, Share with a friend. Keep Venn dual-circle mark and overlap stage.

---

## Color tokens

| Token | Hex | Role |
|-------|-----|------|
| `bg` / `surface` | `#07070A` | App canvas |
| `surface-container-low` | `#121218` | Recessed fields / stage |
| `surface-container` | `#1A1A22` | Elevated cards |
| `surface-container-high` | `#22222C` | Inputs, chips, secondary buttons |
| `surface-container-highest` | `#2A2A36` | Highest elevation accents |
| `on-surface` | `#E8E8ED` | Primary text |
| `on-surface-variant` | `#A8A8B3` | Secondary text |
| `outline` | `#3A3A48` | Strong borders |
| `outline-variant` | `#2C2C38` | Quiet borders |
| `primary` | `#0A84FF` | Brand accent / filled CTA / focus |
| `primary-container` | `#003870` | Selected avatar / tonal chip fill |
| `purple` | `#BF5AF2` | Right Venn circle / brand |
| `yellow` / `tertiary` | `#FFD60A` | Daily pair accent, celebration |
| `success` | `#30D158` | Completed progress |
| `on-primary` | `#FFFFFF` | Text on filled primary |

Reuse/refine existing CSS vars in the app where present (`--bg`, `--accent`, etc.) rather than inventing a parallel token set.

---

## Radii

| Element | Radius |
|---------|--------|
| Screen cards / profile card | 28px |
| Elevated content cards | 20–24px |
| Text fields | 14–16px |
| Avatar chips | 12–14px |
| Metric chips | 14px |
| Primary / secondary buttons | Fully rounded (height/2) |
| Quiet nav pills | Fully rounded |

---

## Type scale (Inter)

| Role | Size / weight | Usage |
|------|---------------|-------|
| Display / score | 72 Extra Bold | Reveal score |
| Headline medium | 28 Semi Bold | Create Profile, Hey Kyle |
| Title large | 22–24 Semi Bold | Desktop card title |
| Title medium | 16–18 Semi Bold | Pair prompt, quote |
| Body large | 15–16 Regular/Medium | Instructions, inputs |
| Body medium | 13–14 Regular | Helper copy |
| Label small | 11–12 Medium | Overlines, chip labels |

Font gotcha: Inter styles are `"Semi Bold"` / `"Extra Bold"` (spaced), not SemiBold/ExtraBold.

---

## Spacing

- Base grid: **8dp**
- Screen horizontal padding: **16**
- Card internal padding: **20–28**
- Stack gaps between major blocks: **16–20**
- CTA stack gap: **12**
- Avatar gap: **8**; avatar size: **48×48** (desktop 44)

---

## CTA hierarchy rules

1. **Exactly one** filled primary (`#0A84FF`) per screen.
2. Secondary is tonal fill (`surface-container-high`) + quiet outline — not a second solid brand button.
3. Tertiary / nav = smaller tonal pills or text links (`primary` for “More options”).
4. Focused inputs use 2px primary stroke on recessed surface-low.

### Per screen

| Screen | Primary | Secondary | Quiet |
|--------|---------|-----------|-------|
| Create Profile | Play today’s pair | Join Lobby | More options |
| Lobby | Play today’s pair | Join friends room | Gallery / How to / Settings |
| Round | Lock it in | — | — |
| Reveal | Next round | Share with a friend | — |

---

## Component notes for implementation

### Create Profile
- Elevated surface card on canvas.
- Daily pair strip: tonal high + soft yellow border (opacity ~0.3), sentence-case week label.
- Username field focused primary ring; counter `4/12`.
- Avatar selected = primary-container fill + 2px primary ring.

### Lobby
- Greeting + **stat chips** (one tonal-primary for streak; others surface-high).
- Daily pair as elevated surface card with soft yellow edge.
- Quiet nav row under CTAs (44px height pills).

### Round / Write
- Soft **continuous** progress track (not harsh equal blocks): success tint on completed, primary fill on current, muted remainder; quiet 1–5 labels.
- Dual-circle stage on surface-low card; sentence-case circle labels; yellow “the overlap”.
- Answer field pill + primary stroke; Lock it in primary.

### Reveal / Score
- Score hero card with **soft yellow gradient wash** (not hard neon glow).
- “Nice hit” quiet overline; big score; metric chips (Wit / Logic / Originality / Clarity).
- Quote card; stacked Next (primary) then Share (tonal).

### Desktop Create Profile
- 1440×900: left marketing headline + right profile card matching mobile hierarchy.
- Same CTA rules and tokens.

---

## Implementation constraints (for Cloud Agent / PR)

- Repo: `hondoentertainment/giant-schrodinger`
- Keep **Phase 9** behavior; solo still works without account.
- No secrets in code/PR.
- Match Figma hierarchy & tokens — not pixel-perfect casino chrome.
- Reuse existing design tokens / CSS variables; refine values toward this spec.
- Open a PR; run lint / tests / build if present; **do not merge**.

---

## Accessibility checklist

- [x] Body ≥ 16 where primary reading occurs (inputs / CTAs / pair prompts)
- [x] Tap targets ≥ 44 (avatars 48, buttons 52)
- [x] Primary on dark AA+ (`#0A84FF` on `#07070A` / dark surfaces)
- [x] On-surface `#E8E8ED` on `#1A1A22` for card text
