# Chart Rendering — Spec Delta (remove-95-limits)

## MODIFIED Requirements

### Requirement: Limit-linje-flade (qicharts2-parity)

Chartet SHALL rendere præcis: datalinje, centerline (CL/mål) og 3σ-kontrolgrænser (UCL/LCL) — sidstnævnte med valgfrit udfyldt bånd imellem. 95%-grænser (2σ), 68%-grænser (1σ), specification-grænser og regressions-/trend-linje SHALL ikke findes — hverken som beregning, rendering, settings eller tooltip-indhold. (Bevidst strammere end qicharts2's opt-in `show.95` — beslutning: Johan, 2026-06-11.)

#### Scenario: Linje-fladen er minimal

- **WHEN** formatting-panelets Linjer-kort inspiceres
- **THEN** findes grupperne Hovedlinje, Centerlinje, Mållinje og 99%-kontrolgrænser — ingen 95%-, 68%-, specification- eller trend-grupper

#### Scenario: Kun 3σ-grænser rendres

- **WHEN** et kontroldiagram tegnes
- **THEN** vises højst datalinje + centerline + mållinje + 3σ-grænser (+ evt. bånd); ingen 95%-linjer
