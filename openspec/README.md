# OpenSpec — status

Oversigt over projektets change-forslag pr. 2026-09-10. Flere af dem blev
skrevet og delvist udført på branchen `feat/anhoj-rules-f1`, som aldrig blev
merged til `main`.

## Udført og på main

| Change | Landede via |
|---|---|
| `changes/add-anhoj-rules/` | F1 — de to runs-regler og stiplet centerlinje |
| `changes/archive/2026-06-11-remove-non-anhoj-rules/` | PR #4 (`faafe95`) — `trend`, `twoInThree`, `shift`, NHS-ikoner |
| `changes/add-anhoj-stats-display/` | PR #3 — men som **signalpanelet**, en anden implementation end branchens `drawAnhojStats.ts` |

## Besluttet, men ikke på main

Alle fire blev besluttet 2026-06-11 og udført på `feat/anhoj-rules-f1`.
Koden er ikke merget; kun beslutningsgrundlaget ligger her.

| Change | Hvad står tilbage på main |
|---|---|
| `changes/remove-95-limits/` | 21 `*_95`-properties i `capabilities.json` og tilhørende settings |
| `changes/remove-download-button/` | `src/D3 Plotting Functions/drawDownloadButton.ts` + `download_options.show_button` |
| `changes/danish-ui/` | formateringsruden er engelsk. På branchen er den oversat ("Linjer", "Signaler", "Punkter uden for kontrolgrænser") |
| `changes/add-limit-band/` | findes ikke. Branchen har `src/D3 Plotting Functions/drawLimitBand.ts` — farvelagt 3σ-bånd, default fra |

To ting hører til `danish-ui` og mangler på main:

- `src/Functions/toFixedComma.ts` — dansk decimalkomma. Fire linjer:

  ```ts
  export default function toFixedComma(value: number, decimals: number): string {
    return value.toFixed(decimals).replace(".", ",");
  }
  ```

  Main formaterer tal uden komma-håndtering nogen steder. For danske brugere
  vises `3.5` hvor der skulle stå `3,5`.

## Ikke afgjort

| Change | Note |
|---|---|
| `changes/remove-non-anhoj-rules/` (maj-versionen) | Overhalet af juni-revisionen i `archive/`. Bevaret alene for `specs/centerline-calculation/spec.md`, som argumenterer for at fjerne chart-typerne `i_m` og `i_mm` — de findes ikke i `qicharts2` og er stadig valgbare |
| `changes/archive/2026-06-11-align-limits-qicharts2/` | Arkiveret som udført på branchen. Ikke efterprøvet mod main |

## Vigtigt om koden

Dokumenterne her er beslutningsgrundlaget. **Implementationerne findes kun på
`feat/anhoj-rules-f1`.** Slettes den branch, bliver commits uden reference
efterhånden ryddet af Git, og koden er væk — også `drawLimitBand.ts`,
`toFixedComma.ts` og den oversatte formateringsrude.

Branchen er bygget mod kodebasen før Vitest-migreringen og før signalpanelet,
så den kan ikke merges direkte. Skal arbejdet bruges, er vejen at
genimplementere per change ovenfor med branchen som reference.

Vil du kunne slette branchen uden at miste koden, så sæt et tag på dens spids
først — et tag holder commits i live permanent:

```
git tag arkiv/f1-2026-06-11 origin/feat/anhoj-rules-f1
git push origin arkiv/f1-2026-06-11
```

`refactor/remove-non-anhoj-f2` behøver ikke det. Alt den har, som main mangler,
er enten det, F2 bevidst fjernede, eller Karma-infrastruktur afløst af
Vitest — og dens plan er bevaret i `changes/remove-non-anhoj-rules/`.
