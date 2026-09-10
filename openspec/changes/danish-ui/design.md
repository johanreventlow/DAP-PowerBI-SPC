# Design: danish-ui

## Context

Bruger-vendte strenge er spredt over Settings Model (166 unikke labels + dropdown-arrays), capabilities dataRoles, viewModel-tabelkolonner, buildTooltip, validerings-/fejlbeskeder og derivedSettings' dynamiske navne. Dropdown-values og textOption-defaulten "Automatic" sammenlignes i kode og må ikke ændres.

## Goals / Non-Goals

**Goals:** Konsistent dansk SPC-terminologi overalt hvor brugeren ser tekst; nul funktionel ændring.
**Non-Goals:** i18n-framework/locale-switching (én fast dansk tekst); oversættelse af kode-kommentarer/commit-historik; `date_format_locale`-værdier.

## Decisions

1. **Ordbogsbaseret oversættelse** med eksakte streng-matches per fil — ingen regex-gætteri på delstrenge.
2. **Dropdown-labels via `displayNames`-parameteren** (5. argument i `dropdownOption`); values urørte (fx "Start"/"End", "Automatic").
3. **Terminologi (Anhøj-dansk):** run→serie, crossings→kryds, control limits→kontrolgrænser, centerline→centerlinje, astronomical→punkt uden for kontrolgrænser, rebaseline→fase, run chart→seriediagram. UCL/LCL i tabel: "Øvre/Nedre 99%".
4. **Gruppe-nøgler i settingsGroups ER displayNames** → oversættes (fx "Anhoej Rules"→"Anhøj-regler"); tests opdateres tilsvarende. Danske tegn (æøå) bruges — verificeres i Power BI i den manuelle test.
5. **"Automatic"-defaults beholdes som værdi**; kun dropdown-displayName for "Automatic" oversættes ("Automatisk").

## Risks / Trade-offs

- **[lav] æøå i formatting-panelet:** burde være uproblematisk (Unicode), men det tidligere oe-rename antyder forsigtighed — manuel Power BI-verifikation er gate.
- **[lav] Oversete strenge:** afsluttende grep-sweep efter typiske engelske ord ("Show ", "Colour", "Width") i bruger-vendte filer.
