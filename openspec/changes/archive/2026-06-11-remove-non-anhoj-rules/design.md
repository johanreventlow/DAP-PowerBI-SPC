# Design: remove-non-anhoj-rules (F2)

## Context

Post-F1-state (branch `feat/anhoj-rules-f1`, rebaset på upstream main 2026-06-11): Anhøj-reglerne er boolean-seriesignaler der driver per-gruppe stiplet centerline. Upstream-arven omfatter fire punktflaggings-regler (astronomical, shift, trend, twoInThree) med fælles infrastruktur (`checkFlagDirection`, colour-settings per regel, `outliersObject`-arrays, tooltip/tabel-kolonner) samt NHS-ikonsystemet (variation/assurance-ikoner i summary table + chart-hjørne, drevet af regel-output).

Upstream har netop migreret til modulær settings-model (`src/Settings Model/*.ts`), vitest og pre-computed render-arrays — F2 bygger på den struktur.

## Goals / Non-Goals

**Goals:**
- Visualen tilbyder præcis qicharts2's signalsæt: sigma-signal (astronomical) + runs-signal (Anhøj long-run/few-crossings)
- Død kode fjernes helt — ingen skjulte/deaktiverede rester
- Settings-panel viser kun relevante grupper (General, Astronomical, Anhoej Rules)
- Testsuiten forbliver grøn; Anhøj- og astronomical-dækning uberørt

**Non-Goals:**
- Rebrand/omdøbning (F3)
- Ændringer i Anhøj-reglernes semantik eller astronomicals adfærd
- Summary-table-fjernelse (kun ikon-kolonner/-filtre fjernes; tabellen består)
- Upstream-merge-venlighed (F2 divergerer bevidst)

## Decisions

1. **Rækkefølge: regler først, ikoner bagefter, i ÉN change men separate commits.** Ikonerne (variationIconsToDraw) konsumerer shift/trend/twoInThree-output — fjernes reglerne først, brækker ikonerne; derfor: commit 1 = NHS-ikoner (fjerner konsumenten), commit 2 = regler (fjerner producenten), commit 3 = settings/capabilities-oprydning + docs. Hver commit skal være grøn (tsc + vitest).
2. **`checkFlagDirection` beholdes** — astronomical bruger improvement_direction-mapping. `process_flag_type`/`improvement_direction`-settings består i "General".
3. **`outliersObject` reduceres** til `{ astpoint, per_group_signals }`. `directionMappedKeys`-loopet i flagOutliers kollapser til kun astpoint — forenkles til direkte kald.
4. **`summaryTableRowData`**: `shift`/`trend`/`two_in_three`-felter fjernes; tilhørende kolonnedefinitioner + tooltip-linjer ligeså. Eksisterende rapporter med disse tabel-kolonner valgt mister kolonnerne (acceptabelt breaking, pre-1.0).
5. **capabilities.json + Settings Model synkront i samme commit** — kendt faldgrube: manglende den ene side fejler tavst i Power BI.
6. **Slettede tests slettes, ikke skippes.** `anhojVsShift.test.ts` (kontrast-dokumentation) mister sin reference-regel → slettes; kontrasten er dokumenteret i openspec-arkivet.
7. **Ingen ny dist-build som del af F2-commits** — build køres som verifikation, artefakt-bump sker ved næste version-bump.

## Risks / Trade-offs

- **[lav] Skjulte afhængigheder til fjernede felter** (tooltips, conditional formatting, tabel): mitigeres med grep-sweep per felt + tsc strict + fuld vitest efter hvert commit.
- **[lav] .pbix-rapporter med gemte settings for fjernede properties**: Power BI ignorerer ukendte properties ved load; toggles forsvinder bare fra panelet. Ingen migration nødvendig.
- **[middel] Upstream-merge-konflikter fremover**: accepteret — F2 ER divergensen. Fremtidige upstream-bugfixes cherry-pickes manuelt.
- **[lav] Power BI-rendering stadig uverificeret (F1-gate udskudt)**: F2 fjerner kode og rører ikke Anhøj-render-pathen; bisect-punkt `PBISPC.1.7.4.28-F1-complete.pbiviz` er sikret før F2 påbegyndes.
