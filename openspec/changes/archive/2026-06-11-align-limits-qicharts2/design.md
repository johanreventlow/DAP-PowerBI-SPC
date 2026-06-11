# Design: align-limits-qicharts2

## Context

Post-F2: regelsættet er qicharts2-rent (astronomical + Anhøj), men linje-fladen arver upstreams 68/95/99 + specification + trend-linje, og punktfarver styres af retningssemantik (improvement/deterioration) som qicharts2 ikke har. Verificeret empirisk: qicharts2 plotter CL + 3σ-grænser; 95% findes som opt-in (`show.95=FALSE`); 68%, spec-limits, regressionslinje og retningsfarver findes ikke.

## Goals / Non-Goals

**Goals:**
- Linje-flade = qicharts2: CL + UCL/LCL (3σ) default; 95% opt-in default-fra
- Astronomical: altid 3σ, én konfigurerbar farve
- Død plumbing fjernes helt (beregning, rendering, tooltips, tabel, settings, capabilities)

**Non-Goals:**
- Ændringer i limit-FORMLER (beregningerne for 99/95 er allerede qicharts2-ækvivalente)
- Chart-type-reduktion
- Rebrand (F3, parkeret)

## Decisions

1. **ll68/ul68 fjernes fra Limit Calculations** (ikke kun fra UI): død beregning i 14 filer + felter i `controlLimitsObject` giver vedligeholdsstøj og upstream-merge er allerede opgivet. Konsekvens: `astronomical_limit`-limit-map og alle `["68","95","99"]`-loops bliver `["95","99"]`.
2. **`show_95` default false** — eneste 95-ændring. Rendering/beregning/tooltips for 95 består.
3. **Astronomical forenkles i to lag:** (a) `flagOutliers` kalder `astronomical(group_values, ll99, ul99)` direkte uden limit_map/ast_specification; (b) dot-farvning læser `settings.outliers.ast_colour` direkte — `getAesthetic`-flag-mapping og `checkFlagDirection` slettes. Interne flag-værdier forbliver "upper"/"lower"/"none" (tabel + tooltip viser dem).
4. **"General"-outlier-gruppen udgår helt** når process_flag_type + improvement_direction fjernes (tom gruppe efterlades ikke). Outlier Settings = Astronomical Points + Anhoej Rules.
5. **Specification**: hele lines-gruppen + speclimits-felter i `controlLimitsObject`/`extractInputData`/`drawLines`-line-keys fjernes. `summaryTableRowData.speclimits_*` ud.
6. **Trend-linje**: `calculateTrendLine`-kald i `calculateLimits` ud; `trend_line`-felt + lines-"Trend"-gruppe + `show_trend`/`ttip_*_trend`-referencer ud.
7. **Commit-plan (atomisk, grøn pr. commit):** C1 68% ud → C2 astronomical 3σ + én farve + direction-removal → C3 specification ud → C4 trend-linje ud → C5 settings-grupper/capabilities-rest + NEWS + formattingModel-asserts. Settings+capabilities ALTID synkront i samme commit (kendt tavs-fejl-faldgrube).

## Risks / Trade-offs

- **[middel] Bred flade (20+ filer):** mitigeres med grep-sweep per nøgle (`68`, `speclimit`, `trend_line`, `checkFlagDirection`, `improvement_direction`) + tsc strict + fuld vitest pr. commit.
- **[lav] Rapporter med 68%/spec/trend-linjer aktive:** linjerne forsvinder ved opgradering — tilsigtet; ingen datatab.
- **[lav] `show_95`-default-skifte:** rapporter der IKKE har rørt indstillingen mister 95-linjerne visuelt (default var true). Tilsigtet qicharts2-paritet; opt-in genaktivering.
