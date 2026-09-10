# Tasks — add-limit-band

## 1. Implementering (ét commit)

- [x] 1.1 `D3 Modules/index.ts`: eksportér `area`
- [x] 1.2 `linesSettings.ts` (99%-gruppen): show_band_99 + band_colour_99 + band_opacity_99; capabilities synkront
- [x] 1.3 `initialiseSVG.ts`: `limitbandgroup` før `linesgroup`
- [x] 1.4 Ny `drawLimitBand.ts`: d3.area per fase over ll99/ul99 (keys.x → xScale); guard: toggle, has_control_limits, grouped mode, non-finite
- [x] 1.5 `visual.ts`: call drawLimitBand
- [x] 1.6 tsc + vitest grøn → commit

## 2. Afslutning

- [x] 2.1 NEWS + bump + `pbiviz package`
- [ ] 2.2 **[MANUELT TRIN]** Power BI: bånd til/fra, farve+gennemsigtighed, faseskift bryder båndet, bag linjer/punkter
