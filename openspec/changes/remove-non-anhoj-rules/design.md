# Design — Remove Non-Anhøj Rules

## Context

F1 (`add-anhoj-rules`) tilføjede Anhøj-runs-rules (long-run + few-crossings) som NYE regler oven på det eksisterende framework, uden at fjerne legacy-kode. Pakken indeholder nu:

- **qicharts2-parity:** `astronomical` (= sigma.signal), `anhojLongRun`, `anhojFewCrossings`
- **Non-qicharts2 legacy:** `trend`, `two_in_three`, `shift`, improvement/deterioration-direction-system, NHS Icons, robust-I-chart-varianter (`i_m`, `i_mm`)

F2 fjerner alt non-qicharts2-materiale. Slutresultat: ren Anhøj-implementation matchende `qicharts2`'s `runs.analysis` + `sigma.signal` kontrakt.

## Goals / Non-Goals

### Goals

- Fjern alle outlier-regler der ej findes i qicharts2 (`trend`, `two_in_three`, `shift`)
- Fjern direction-mapping-system (`improvement_direction`, `process_flag_type`, `checkFlagDirection`) — irrelevant uden de regler der brugte det
- Fjern PowerBI-SPC-innovationer (`i_m`, `i_mm` chart-types)
- Omdøb `astronomical` → `outsideControlLimits`; gør det direction-agnostisk
- Hardcode 3σ-grænser (fjern multi-sigma + Specification-options)
- Fjern NHS-ikoner (variation/assurance-arrows)
- Bevar attribution til AUS-DOH + qicharts2 i NEWS/comments

### Non-Goals

- Rebrand af visual-identitet (visual.guid, displayName, supportUrl) → F3
- Migration-shims for eksisterende rapporter (ingen produktionsbrug)
- Performance-optimering ud over hvad sletning naturligt giver
- Tilføjelse af nye regler (kun fjernelse + omdøbning)

## Decisions

### Decision 1: `astronomical` omdøbes til `outsideControlLimits`

**Hvad:** Fil + funktion + outliersObject-felt + setting-key omdøbes:

```
src/Outlier Flagging/astronomical.ts → outsideControlLimits.ts
outliersObject.astpoint → outsideControlLimits.outside_control_limits
inputSettings.outliers.astronomical → inputSettings.outliers.outside_control_limits
settings displayName "Highlight Astronomical Points" → "Highlight Outside Control Limits"
```

**Hvorfor:** "Astronomical point" er en Western-Electric-term. qicharts2 og almindelig SPC-terminologi bruger "outside control limits" eller "sigma signal". For BFH-brugere er det klarere terminologi.

**Konsekvens:** Settings-key-renaming er et breaking change for eksisterende rapporter (dead `astronomical`-key, ny `outside_control_limits`-key). Acceptabelt jf. proposal.md backwards-compat-sektion.

### Decision 2: Hardcode 3σ-grænser

**Hvad:** Fjern `astronomical_limit`-dropdown (`"1 Sigma"`, `"2 Sigma"`, `"3 Sigma"`, `"Specification"`). `outsideControlLimits` kalder ALTID med 3σ-grænserne (`ll99`/`ul99`).

**Hvorfor:** qicharts2 bruger kun 3σ. Multi-sigma-options var koblet til `two_in_three` (warning-limits ved 2σ) — som fjernes. Specification-limits-option blev primært brugt med two_in_three. Anhøj's signal-detektion bruger ej warning-limits.

**Alternativer overvejet:**
- Behold Specification-option for BFH-clinical-use-case (eksterne acceptance-mål) — afvist: F2 fokuserer på qicharts2-parity; Specification-limits kan genintroduceres som separat F4-feature hvis brug-case opstår.

**Konsekvens:** Warning-limits-rendering (ll95/ul95, ll68/ul68) bliver dead — fjernes (Decision 3).

### Decision 3: Fjern warning-limits-rendering (1σ + 2σ)

**Hvad:** I `src/settings.ts`, fjern:
- `lines.show_95` (2σ-grænser)
- `lines.show_68` (1σ-grænser)

I `viewModelClass.calculateLimits` og chart-type-impls (`p.ts`, `u.ts`, `c.ts`, `i.ts`, `mr.ts`): output-felter `ll95`, `ul95`, `ll68`, `ul68` kan beholdes som beregning (de er trivielle), men rendering-laget viser dem ej længere.

**Hvorfor:** Anhøj bruger kun 3σ. Warning-limits gav kun visuel betydning ifm. `two_in_three`-reglen som fjernes.

**Alternativer overvejet:**
- Behold som user-toggle (default off) — afvist: tilføjer settings-kompleksitet uden brug-case
- Fjern også beregningen i chart-impls — afvist: minimal-impact-princip; lad data-strukturen være, kun fjern UI

### Decision 4: `outsideControlLimits` bliver direction-agnostisk

**Hvad:** Samme pattern som F1's `anhoj_long_run`:

1. Reglen returnerer "upper"/"lower"/"none" (samme som før)
2. I post-loop `checkFlagDirection`-mapping: SKIP `outside_control_limits` (fjernes alligevel — se Decision 5)
3. I point-aesthetic-iteration: pre-map "upper"/"lower" → "neutral_high"/"neutral_low" før `getAesthetic`-call

**Hvorfor:** Bruger har valgt at fjerne `improvement_direction` + `process_flag_type` settings. Uden direction-mapping er der kun side-information tilbage. Genbrug af eksisterende `_neutral_high`/`_neutral_low`-color-suffixes fra `createOutlierColours`.

### Decision 5: Slet `checkFlagDirection` + direction-mapping-loop

**Hvad:**
- Slet `src/Outlier Flagging/checkFlagDirection.ts`
- I `flagOutliers`: fjern hele `Object.keys(outliers).forEach(...)` post-loop
- Fjern `process_flag_type` og `improvement_direction` reads fra `flagOutliers`-signatur
- Fjern `process_flag_type` og `improvement_direction` fra settings.ts

**Hvorfor:** Med `trend`, `two_in_three`, `shift` fjernet er der INGEN regler tilbage der bruger direction-mapping. `outsideControlLimits` + `anhoj_long_run` er begge direction-agnostiske (Decision 4 + F1's bypass). Dead code.

**Konsekvens:** `settingsClass.ts:107` (`improvementDirection`-read) skal også fjernes/oprydes.

### Decision 6: Fjern NHS Icons komplet

**Hvad:** Slet:
- `src/D3 Plotting Functions/NHS Icons/` (11 ikon-filer + index)
- `src/D3 Plotting Functions/drawIcons.ts`
- `src/D3 Plotting Functions/initialiseIconSVG.ts`
- `src/Outlier Flagging/assuranceIconToDraw.ts`
- `src/Outlier Flagging/variationIconsToDraw.ts`
- `nhs_icons` section i `settings.ts`
- Imports + kalder-sites i `viewModelClass.ts` + `visual.ts` (eller wherever frontend setup)

**Hvorfor:** NHS Making Data Count-ikoner er deres specifikke kommunikations-framework (improvement/deterioration/consistent-pass/fail). Direkte modsætning til Anhøj-filosofien (direction-agnostisk signal = invitation til undersøgelse).

**Konsekvens:** Hele visual.ts/frontend.ts mister NHS-icon-rendering-pipeline. Resterende rendering-pipeline (linjer, dots, axes, labels) er intakt.

### Decision 7: Fjern `i_m` + `i_mm` chart-typer

**Hvad:**
- Slet `src/Limit Calculations/i_m.ts`
- Slet `src/Limit Calculations/i_mm.ts`
- Fjern fra `src/Limit Calculations/index.ts` barrel-export
- Fjern fra `src/settings.ts:140` `chart_type.valid` + `items`
- Fjern fra `src/Classes/derivedSettingsClass.ts` (lookup-tables)
- Fjern fra `capabilities.json` hvis listet

**Hvorfor:** Bruger eksplicit valgt (F1-explore-cycle): `i_mm` ej nødvendig; analogt for `i_m` (median-CL + mean-MR hybrid). Begge er PowerBI-SPC-innovationer der ej findes i qicharts2. Renest narrative: kun `i` som I-chart.

**Konsekvens:** Eksisterende rapporter med `chart_type = "i_m"` eller `"i_mm"` får unknown-chart-type ved load. Acceptabelt jf. proposal.md (ingen produktionsbrug).

### Decision 8: Bevar `i.ts` som eneste I-chart-impl

**Hvad:** `i.ts` (mean centerline + mean MR + 3σ) bevares uændret. Det matcher qicharts2's `qic.i` eksakt.

**Hvorfor:** qicharts2-parity. Anhøj-regler virker oven på mean-CL (de er centerline-agnostiske).

### Decision 9: Bevar attribution + qicharts2-reference

**Hvad:** NEWS.md, README.md (når rebranded i F3), og kode-kommentarer skal eksplicit credit:

- AUS-DOH-Safety-and-Quality/PowerBI-SPC (oprindelig pakke)
- qicharts2-pakken (Anhoej + Olesen — implementations-reference)

**Hvorfor:** GPL-3.0-licens kræver attribution. Også god videnskabelig praksis.

**Konsekvens:** I F2 tilføjes attribution-blok i NEWS-entry + i comments i de filer der direkte porterer qicharts2-logik (`anhojLongRun.ts`, `anhojFewCrossings.ts`, `outsideControlLimits.ts`). Fuld README-attribution sker i F3.

## Risks / Trade-offs

| Risiko | Mitigation |
|--------|-----------|
| Eksisterende rapporter (uden for BFH) bryder | Bekræftet ingen produktionsbrug. Pre-1.0 pakke, breaking change accepteret. |
| F1 manuel-test endnu ej kørt; F2-fjernelser kan maskere F1-bugs | F2 berører IKKE de F1-tilføjede filer (anhojLongRun, anhojFewCrossings, qbinom). Hvis F1-manual-test fejler, fix på F1-branch + rebase F2. |
| `i_m`/`i_mm`-fjernelse er silent breakage | NEWS-entry markerer eksplicit. F2's commit-msg gør det også klart. |
| F3 (rebrand) afhænger af F2-fjernelser → seriel | Acceptabel — F3 er kosmetisk og kan vente. |
| Manglende attribution → GPL-3.0-violation | Decision 9 sikrer attribution i F2 NEWS + comments; fuld README-attribution i F3. |

## Migration Plan

Ingen migration. F2 er fresh-start-compatible. Hvis nogen ekstern bruger eksisterer (ej BFH):

1. NEWS-entry beskriver alle breaking changes eksplicit
2. CHANGELOG-narrative: "F2 er en bevidst divergens fra AUS-DOH-pakken til en ren Anhøj-implementation. Hvis du ønsker NHS Making Data Count-ikoner eller direction-baseret coloring, brug AUS-DOH's upstream-version."

## Open Questions

Ingen åbne tekniske spørgsmål efter explore-cyclus 2026-05-19.
