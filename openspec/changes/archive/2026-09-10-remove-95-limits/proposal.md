# Proposal: remove-95-limits

## Why

Beslutning revideret af Johan (2026-06-11): 95%-kontrolgrænserne fjernes helt — også som opt-in. Visualen skal kun vise centerline + 3σ-kontrolgrænser. (qicharts2's `show.95` er opt-in, men minimal flade vægtes højere end fuld paritet på dette punkt.)

## What Changes

- **BREAKING** 95%-grænser (2σ) fjernes helt: settings-gruppe, beregning (ll95/ul95 i alle limit-filer), rendering, tooltips, tabel-kolonner.
- Linjer-kortet består herefter af: Hovedlinje, Centerlinje, Mållinje, 99%-kontrolgrænser (inkl. kontrolgrænsebånd).

## Capabilities

### New Capabilities

(ingen)

### Modified Capabilities

- `chart-rendering`: limit-linje-fladen uden 95%-opt-in. Delta: `specs/chart-rendering/spec.md`.

## Impact

Samme flade som 68%-fjernelsen (commit a5eedd2): linesSettings, capabilities (21 properties), 14 Limit Calculations-filer, controlLimitsObject, viewModel-loops/tabel, drawLineLabels/getAesthetic-maps, buildTooltip.
