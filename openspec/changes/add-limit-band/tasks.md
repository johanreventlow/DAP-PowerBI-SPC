# Tasks — add-limit-band

## 1. Implementering (ét commit)

- [ ] 1.1 `D3 Modules/index.ts`: eksportér `area`
- [ ] 1.2 `linesSettings.ts` (99%-gruppen): show_band_99 + band_colour_99 + band_opacity_99; capabilities synkront
- [ ] 1.3 `initialiseSVG.ts`: `limitbandgroup` før `linesgroup`
- [ ] 1.4 Ny `drawLimitBand.ts`: d3.area per fase over ll99/ul99 (keys.x → xScale); guard: toggle, has_control_limits, grouped mode, non-finite
- [ ] 1.5 `visual.ts`: call drawLimitBand
- [ ] 1.6 tsc + vitest grøn → commit

## 2. Afslutning

- [ ] 2.1 NEWS + bump + `pbiviz package`
- [ ] 2.2 **[MANUELT TRIN]** Power BI: bånd til/fra, farve+gennemsigtighed, faseskift bryder båndet, bag linjer/punkter
