# Design: add-anhoj-stats-display

## Context

Anhøj-reglerne returnerer i dag kun booleans; mellemtallene (longest run, tærskler, kryds) beregnes og smides væk. Fixtures fra qicharts2 indeholder allerede facit for alle mellemtal — testgrundlag eksisterer. Render-infrastruktur: SVG-tekst via d3, `plotProperties.xScale` + `controlLimits.keys[].x` giver fasens x-interval; `drawLineLabels`/`drawValueLabels` er mønster.

## Goals / Non-Goals

**Goals:** Persistent per-fase statistik på canvas; dansk default-tekst, konfigurerbar; default slået fra (ingen overraskelser i eksisterende rapporter); tal identiske med qicharts2.

**Non-Goals:** Tooltip-integration (kan tilføjes senere); visning i grouped/multi-indicator-tilstand (chartet rendres ikke der); interaktivitet på teksten.

## Decisions

1. **Én kilde til statistik:** `anhojStats(val, centerline)` i anhojShared; `anhojLongRun`/`anhojFewCrossings` bliver `anhojStats(...).longRunSignal`-wrappers. Eksisterende tests + kontrakter uændrede.
2. **Stats beregnes altid per gruppe i `flagOutliers`** (billigt, O(n)) og gemmes i `per_group_signals[g].stats`; dash-signalerne forbliver gated af deres toggles (uændret adfærd).
3. **Rendering:** tekstblok med to `tspan`-linjer per fase, x = midtpunkt af fasens nøgle-interval via xScale, y = fast offset fra plotområdets top. Kollisionshåndtering udskydes (Non-Goal) — brugeren kan slå elementet fra.
4. **Settings i "Anhoej Rules"-gruppen:** `show_anhoj_stats` (toggle, default false), `anhoj_stats_font`, `anhoj_stats_size`, `anhoj_stats_colour`, `anhoj_stats_label_run` (default "Længste serie"), `anhoj_stats_label_crossings` (default "Kryds"). Format: `<label_run>: <longestRun> (maks <longestRunMax>)` / `<label_crossings>: <nCrossings> (min <nCrossingsMin>)`.
5. **Degenererede faser** (`nUseful < 2`): ingen tekst for fasen (stats er NA i qicharts2-forstand).

## Risks / Trade-offs

- **[lav] Visuel støj ved mange faser/smalle segmenter:** accepteret — default fra, og brugeren styrer font-størrelse.
- **[lav] Overlap med datapunkter nær toppen:** accepteret i v1; evt. position-option senere.
