# PowerBI-SPC — Anhøj-version

## Project Overview

**Type:** TypeScript / Power BI Visual
**Stack:** TypeScript, Power BI Visuals SDK (`powerbi-visuals-api`), D3,
vitest + playwright (upstream migrerede fra Karma/Jasmine i maj 2026)
**Build:** `pbiviz package`
**Origin:** Fork af [AUS-DOH-Safety-and-Quality/PowerBI-SPC](https://github.com/AUS-DOH-Safety-and-Quality/PowerBI-SPC)
**Licens:** GPL-3.0 (arvet)

**Mål:** Modificér forken til at implementere udelukkende **Anhøj-reglerne**
(median-centerline + unusually long run + unusually few crossings).
Reference-implementation: R-pakken `qicharts2`.

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
| F0 | Build virker (Mac) | DONE |
| F1 | Tilføj Anhøj-regler additivt + sammenligningstest | DONE + Power BI-verificeret 2026-06-11 |
| F2 | Fjern `shift`, `trend`, `twoInThree`, NHS-ikoner — `astronomical` BEHOLDT | DONE + Power BI-verificeret 2026-06-11 |
| F2+ | Ekstra features: stats-display, dansk UI, kontrolgrænsebånd, decimalkomma, fjern download | DONE (alle commits på `feat/anhoj-rules-f1`, build 1.7.4.34) |
| F3 | Rebrand + dokumentation | PARKERET (Johan afventer branding-beslutning) |

Detaljer: `docs/spc-anhoj-context.md` §6. **F2-scope revideret 2026-06-11**
(empirisk qicharts2-verifikation): oprindelig plan ville fjerne
`astronomical` og beholde `shift` — begge vendt om, da qicharts2 HAR
sigma-signal og IKKE har fast-n shift. Se
`openspec/changes/remove-non-anhoj-rules/`.

### GUID

`BFHSPC` (skiftet fra `PBISPC` 2026-06-11 — IT har upstream-visuel org-deployet med `PBISPC`).
GUID er låst fremover: ændring efter udrulning = alle rapporter re-konfigureres.

### Centrale integrationspunkter

- `src/Classes/viewModelClass.ts` — `flagOutliers` (regel-orchestration) + `per_group_signals`
- `src/Outlier Flagging/` — `anhojLongRun.ts`, `anhojFewCrossings.ts`, `anhojShared.ts`
- `src/D3 Plotting Functions/drawAnhojStats.ts` — on-canvas stats-blok
- `src/Settings Model/outliersSettings.ts` — Anhoej Rules-gruppe
- `src/D3 Plotting Functions/drawLines.ts` — pre-computed stroke-arrays (inkl. Anhøj-dashing)

### Test-strategi

vitest + playwright chromium (`npx playwright install chromium` kræves).
Testfiler: `*.test.ts` (ikke `test-*.ts` — samles ikke op af vitest).
Reference-fixtures fra `qicharts2` hardkodet i `test/Outlier Flagging/`.

### Åben bloker: upstream-rebase

`feat/anhoj-rules-f1` har konflikter med `origin/main` (upstream AUS-DOH divergerede — vitest-migration, settings-refaktor til `src/Settings Model/*.ts`, drawLines pre-computed arrays). PR #1 = draft, kan ikke merges. Rebase forsøgt 2026-06-17, afbrudt.

**Conflicts i commit `2cc30c2`:**
- `src/settings.ts` — Anhøj-gruppe skal flyttes til `outliersSettings.ts` (modulær format)
- `src/Classes/viewModelClass.ts` — 3 steder: type `lineData`, `group_targets`-cast, Anhøj-skip i direction-mapping
- `src/D3 Plotting Functions/drawLines.ts` — Anhøj-dashing fra `.attr()`-callback → pre-computed `strokeDashArray[i]`

---

## Workflow

- **Branches:** `feat/anhoj-*`, `refactor/remove-non-anhoj-*`, `chore/*`
- **PR-format:** `--draft` default (jf. global GIT_WORKFLOW.md)
- **OpenSpec:** Brug `/opsx:propose` for non-trivielle ændringer
  (Anhøj-rule-tilføjelser kvalificerer)
- **Versioning:** Pre-1.0, `pbiviz.json` + `package.json` versions
  synkront (jf. POWERBI_VISUAL_STANDARDS.md)

---

## Kodepræferencer (projekt-niveau)

- Write the absolute minimum code required
- No sweeping changes; no unrelated edits
- Focus on task at hand
- Make code precise, modular, testable
- Don't break existing functionality (Fase 1; Fase 2 fjerner eksplicit)
- Hvis Johan skal gøre noget manuelt: sig det klart med **[MANUELT TRIN]**

---

**Sidst opdateret:** 2026-06-17
