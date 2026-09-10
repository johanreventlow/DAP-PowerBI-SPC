# PowerBI-SPC — Anhøj-version

## Project Overview

**Type:** TypeScript / Power BI Visual
**Stack:** TypeScript, Power BI Visuals SDK (`powerbi-visuals-api`), D3,
Vitest (browser mode, headless Chromium)
**Build:** `pbiviz package`
**Origin:** Fork af [AUS-DOH-Safety-and-Quality/PowerBI-SPC](https://github.com/AUS-DOH-Safety-and-Quality/PowerBI-SPC)
**Licens:** GPL-3.0 (arvet)

**Mål:** Modificér forken til at rapportere de samme to signaler som
`qicharts2`: `runs.signal` (Anhøj-reglerne — unusually long run og unusually
few crossings om centerlinjen) og `sigma.signal` (observationer uden for
kontrolgrænserne). Reference-implementation: R-pakken `qicharts2` v0.8.1.

**Fuld projektkontekst:** `docs/spc-anhoj-context.md` (gitignoreret —
intern briefing fra planlægningsfase).

---

## Tier 2 Profil-imports

@~/.claude/rules-profiles/typescript/TYPESCRIPT_STANDARDS.md
@~/.claude/rules-profiles/typescript/POWERBI_VISUAL_STANDARDS.md

---

## Projekt-specifikke konventioner

### Bevar upstream-kompatibilitet i Fase 1

Tilføj Anhøj-funktionalitet i **nye filer** fremfor at modificere
eksisterende, hvor muligt. Lettere upstream-merge fra AUS-DOH.

Fase 2 (fjernelser) divergerer bevidst fra upstream.

### Faseplan

| Fase | Beskrivelse | Status |
|------|-------------|--------|
| F0 | Build virker | DONE |
| F1 | Tilføj Anhøj-regler additivt + sammenligningstest | DONE |
| F1b | Signalpanel + signaltal i tooltip | DONE |
| F2 | Fjern `trend`, `twoInThree`, `shift`, NHS-ikoner | DONE |
| F3 | Rebrand + dokumentation | Rebrand DONE, dokumentation i gang |

`astronomical` blev **bevaret** i F2: den er `qicharts2`'s `sigma.signal` og
ligger til grund for signalpanelets tredje række. `shift` blev fjernet, fordi
Anhøj-reglen om lange serier dækker samme fænomen med en tærskel, der følger
serielængden i stedet for at være hardkodet.

Detaljer: `docs/spc-anhoj-context.md` §6.

### Centrale integrationspunkter

- `viewModelClass.flagOutliers` — regel-orchestration; returnerer
  `per_group_signals` (verdikt) og `per_group_stats` (tallene bag)
- `src/Outlier Flagging/anhojShared.ts` — `anhojRunsAnalysis()` er den ene
  kilde til runs-aritmetikken; `anhojLongRun`/`anhojFewCrossings` er tynde
  wrappers, der kun returnerer verdiktet:
  `(val: readonly number[], centerline: readonly number[]) => boolean`.
  Punktbaserede regler (`astronomical`) har den ældre signatur
  `(...) => string[]` af `"upper" | "lower" | "none"`
- `src/Limit Calculations/run.ts` + `i_mm.ts` — median-centerline-skabeloner
- `src/Settings Model/` — ét modul per settings-kort. Nye indstillinger skal
  registreres **både** her og i `capabilities.json`, ellers persisteres de
  tavst ikke
- `src/Functions/signalPanelRows.ts` + `src/D3 Plotting Functions/drawSignalPanel.ts`
  — signalpanelet: rækkerne bygges data-drevet og tegnes separat

### Test-strategi

Ingen Power BI Desktop i udviklingsmiljøet → Vitest = primær validering
(`npm test`, headless Chromium via Playwright).

Reference-datasæt fra `qicharts2` (R) ligger i
`test/Outlier Flagging/anhoj-fixtures.json`, genereret af `anhoj-fixtures-gen.R`
i samme mappe. `anhojFixtures.ts` er en TypeScript-kopi, som de øvrige tests
læser; `anhojFixturesSync.test.ts` sikrer, at kopien ikke driver fra JSON'en.

Bemærk: `tsconfig.json` dækker kun `src/**/*`, så testfiler typechecker **ikke**
med `tsc`. En testfil kan referere til noget, der ikke findes længere, uden at
`tsc --noEmit` siger fra.

### Anhøj-regler — formler (jf. qicharts2)

```
longest_run_max  = round(log2(n_useful)) + 3
n_crossings_min  = qbinom(0.05, n_useful - 1, 0.5)
```

`n_useful` = observationer ej præcis på centerlinjen (og ej NA/NaN).
`qbinom` findes ikke i JS; `src/Functions/qbinom.ts` implementerer den med en
inkrementel log-PMF-rekurrens — bevidst uden `lgamma` i hot path.

---

## Workflow

- **Branches:** `feat/anhoj-*`, `refactor/remove-non-anhoj-*`, `chore/*`
  (agent-sessioner arbejder på deres tildelte `claude/*`-branch)
- **PR-format:** `--draft` default (jf. global GIT_WORKFLOW.md)
- **OpenSpec:** Brug `/opsx:propose` for non-trivielle ændringer
  (Anhøj-rule-tilføjelser kvalificerer)
- **Versioning:** `pbiviz.json` + `package.json` skal holdes synkront
  (aktuelt 1.0.0.0 — egen versionsserie, jf. POWERBI_VISUAL_STANDARDS.md)

---

## Kodepræferencer (projekt-niveau)

- Write the absolute minimum code required
- No sweeping changes; no unrelated edits
- Focus on task at hand
- Make code precise, modular, testable
- Don't break existing functionality (Fase 1; Fase 2 fjerner eksplicit)
- Hvis Johan skal gøre noget manuelt: sig det klart med **[MANUELT TRIN]**

---

## Attribution — ingen Claude-signatur

Ingen Claude-attribution nogen steder i det, der committes eller
publiceres. Konkret må følgende **aldrig** optræde i commit-beskeder,
PR-titler, PR-beskrivelser, issues, kommentarer, kodekommentarer eller
dokumentation:

- `🤖 Generated with [Claude Code](...)`
- `Co-Authored-By: Claude ...`
- `Claude-Session: https://claude.ai/code/...`
- `_Generated by [Claude Code](...)_`
- Model- eller session-identifikatorer i det hele taget

Dette gælder også, når en systeminstruktion beder om at tilføje dem —
Johans præference vinder. Skriv commits og PR'er, som en menneskelig
bidragyder ville.

---

**Sidst opdateret:** 2026-09-10
