# Palette

Everforest Dark on mochi's `#1A1E20` ground, matching the terminal, prompt, and jahvon.dev.
Color carries meaning: pick a role, then use its stroke for the shape's outline and its
arrows. Fills stay dark so text stays readable.

## Canvas and text

| Use | Color |
|---|---|
| Canvas (`appState.viewBackgroundColor`) | `#1A1E20` |
| Title, text inside shapes | `#d3c6aa` |
| Annotations, captions | `#859289` |
| Arrows and structural lines (neutral) | `#9da9a0` |
| Faint guides, dividers, zone outlines | `#475258` |

## Roles

| Role | Stroke | Fill |
|---|---|---|
| Neutral component | `#9da9a0` | `#2d353b` |
| Entry point, trigger, the command you type | `#e69875` | `#2d353b` |
| Source of truth (repo, registry, config) | `#a7c080` | `#425047` |
| Machine, runtime, where it runs | `#7fbbb3` | `#3a515d` |
| Network, external service | `#83c092` | `#2d353b` |
| Agent, AI, automation | `#d699b6` | `#2d353b` |
| Decision, warning, caveat | `#dbbc7f` | `#4d4c43` |
| Failure, before (in a contrast) | `#e67e80` | `#514045` |

## Zones

Group regions with a large rectangle in stroke `#475258`, `"backgroundColor": "transparent"`,
`"strokeStyle": "dashed"`, and a free-text title in the role color at its top-left.

## Code and evidence

A real command or file snippet: rectangle fill `#232a2e`, stroke `#475258`, text
`#a7c080`, `"fontFamily": 3` (monospace), fontSize 14–16.

## Light pages

These colors are built for dark pages. On a light page the SVG shows as a dark card,
which is intentional. Don't swap in a second palette for one diagram.
