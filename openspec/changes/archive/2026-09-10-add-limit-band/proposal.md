# Proposal: add-limit-band

## Why

Kontrolgrænseområdet aflæses lettere som farvelagt bånd (geom_ribbon-stil) end som to streger alene — ønske fra Johan (2026-06-11). Skal være konfigurerbart (farve + gennemsigtighed) og default slået fra.

## What Changes

- Nyt udfyldt område mellem nedre og øvre 3σ-kontrolgrænse (ll99/ul99), tegnet per fase (ribbon brydes ved faseskift ligesom linjerne) og bag linjer/punkter.
- Nye settings i Linjer → 99%-kontrolgrænser: "Udfyld kontrolgrænseområde" (toggle, default fra), "Områdefarve", "Områdets gennemsigtighed" (0–1, default 0.1). Capabilities synkront.
- Charts uden kontrolgrænser (seriediagram) tegner intet bånd.

Ikke-breaking — ren tilføjelse, default fra.

## Capabilities

### New Capabilities

(ingen)

### Modified Capabilities

- `chart-rendering`: kontrolgrænsebånd. Delta: `specs/chart-rendering/spec.md`.

## Impact

- Ny `src/D3 Plotting Functions/drawLimitBand.ts`; `d3.area` eksporteres fra D3 Modules
- `initialiseSVG.ts`: båndgruppe indsat FØR linesgroup (paint-order: bag linjer)
- `visual.ts` call-kæde; `linesSettings.ts` + `capabilities.json` synkront
