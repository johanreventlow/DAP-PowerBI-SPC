## 1. Reference-fixtures

- [ ] 1.1 `test/Chart Types/ip-fixtures-gen.R`: kontinuert serie uden nævner, aggregerede gennemsnit (rå obs. med gentaget x), proportion/rate med varierende nævner, samme serie med/uden screening; gem input, cl, lcl/ucl, screening-flag, sigma.signal, runs.signal
- [ ] 1.2 Kør scriptet → `test/Chart Types/ip-fixtures.json`

## 2. Beregning (TDD)

- [ ] 2.1 `test/Chart Types/ip.test.ts`: enhedstests for `ipLimits` (ingen nævner, relation til I, konstant nævner, 1/√d-skalering, vægtet CL, screening, konstant serie, baseline, ét baselinepunkt) + fixture-sammenligning
- [ ] 2.2 `src/Limit Calculations/ip.ts` + eksport i `index.ts`

## 3. Integration

- [ ] 3.1 `spcSettings.ts`: `ip` + label; `derivedSettingsClass.ts`: props, `value_name`, `denominator_positive`
- [ ] 3.2 `validateInputData.ts`: `DenominatorNotPositive` for `ip`
- [ ] 3.3 Integrationstests via `Visual.update()`: faser, validering, rendering uden NaN, signaler; `ip` i `denominators.test.ts`, `hiddenChartTypes.test.ts`; `i → ip → run → ip` i `chartTypeRoundTrip.test.ts`

## 4. Dokumentation og verifikation

- [ ] 4.1 README (chart-typer + I′-afsnit) og NEWS
- [ ] 4.2 `npm test`, `npm run eslint`, `npx tsc --noEmit`, `npm run build`
- [ ] 4.3 **[MANUELT TRIN]** Power BI: vælg `ip`, med/uden nævner, baseline, faser, procent, tooltips
