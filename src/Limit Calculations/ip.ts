import type { controlLimitsObject, controlLimitsArgs } from "../Classes/viewModelClass";
import isNullOrUndefined from "../Functions/isNullOrUndefined";

/**
 * Beregner kontrolgrænser for et I′-kort (normaliseret individkort,
 * Taylor 2017 / Anhøj, Taylor & Mohammed).
 *
 * I′ er et I-kort, hvor hver observation er en ratio `y_i = n_i / d_i`, og
 * variansen antages at falde med nævneren: `Var(y_i) ≈ σ²/d_i`. Uden nævner
 * er `d_i = 1`, og kortet reduceres til et almindeligt I-kort — med den
 * eksakte konstant `√(π/2)` i stedet for den afrundede `1.128`.
 *
 * **Centerlinje** (vægtet, over baselinepunkterne):
 *
 * $$CL = \frac{\sum n_i}{\sum d_i}$$
 *
 * **Sigma** fra de normaliserede successive differencer i baselinen:
 *
 * $$s_i = \sqrt{\pi/2}\,\frac{|y_i - y_{i-1}|}{\sqrt{1/d_i + 1/d_{i-1}}},
 *   \qquad \bar{s} = \frac{1}{o-1}\sum_{i=2}^{o} s_i$$
 *
 * `outliers_in_limits = false` screener `s_i ≥ 3.2665·s̄` bort og
 * genberegner `s̄` (som `qicharts2`).
 *
 * **Grænser** for alle punkter i fasen med punktets egen nævner:
 *
 * $$LCL_i = CL - 3\,\bar{s}/\sqrt{d_i}, \qquad UCL_i = CL + 3\,\bar{s}/\sqrt{d_i}$$
 *
 * Ingen automatisk afskæring ved 0 eller 1 — I′ er et generelt kort.
 * Brugerens `ll_truncate`/`ul_truncate` anvendes senere i pipelinen.
 *
 * Baselinen (`subset_points`) bestemmer kun CL, `s_i` og `s̄`; det afviger
 * fra `qicharts2::qic.ip`, som tager differencerne over hele fasen, men
 * følger `qic.i` og Taylors metode.
 *
 * @param args - Beregningsargumenter
 * @param args.numerators - Tællere (eller rå målinger uden nævner)
 * @param args.denominators - Valgfri nævnere; skal være endelige og > 0
 * @param args.keys - Nøgler for hvert punkt
 * @param args.subset_points - Indekser for baselinepunkterne
 * @param args.outliers_in_limits - `false` screener store `s_i` før `s̄`
 *
 * @returns controlLimitsObject med samme felter som I-kortet. Med kun ét
 *   baselinepunkt findes intet sigmaestimat, og grænserne er `NaN`
 *   (mappes til `undefined` af `calculateLimits`).
 *
 * @see {@link https://variation.com/normalized-individuals-control-chart/}
 * @see {@link https://anhoej.github.io/spc4hc/i-prime-charts-for-variable-subgroup-sizes.html}
 */
export default function ipLimits(args: Readonly<controlLimitsArgs>): controlLimitsObject {
  const useRatio: boolean = isNullOrUndefined(args.denominators) ? false : args.denominators!.length > 0;

  const numerators: readonly number[] = args.numerators;
  const denominators: readonly number[] | undefined = args.denominators;
  const subset_points: readonly number[] = args.subset_points;
  const n_sub: number = subset_points.length;
  const n: number = args.keys.length;

  const denom = (i: number): number => useRatio ? denominators![i] : 1;
  const value = (i: number): number => useRatio ? numerators[i] / denominators![i] : numerators[i];

  // Vægtet centerlinje: Σn / Σd over baselinen (= aritmetisk gennemsnit når d = 1)
  let sum_num: number = 0;
  let sum_den: number = 0;
  for (let i = 0; i < n_sub; i++) {
    sum_num += numerators[subset_points[i]];
    sum_den += denom(subset_points[i]);
  }
  const cl: number = sum_num / sum_den;

  // Normaliserede successive differencer i baselinen: o - 1 værdier
  const SQRT_HALF_PI: number = Math.sqrt(Math.PI / 2);
  const s: number[] = new Array<number>(Math.max(n_sub - 1, 0));
  let s_sum: number = 0;
  for (let i = 1; i < n_sub; i++) {
    const curr: number = subset_points[i];
    const prev: number = subset_points[i - 1];
    s[i - 1] = SQRT_HALF_PI * Math.abs(value(curr) - value(prev))
             / Math.sqrt(1 / denom(curr) + 1 / denom(prev));
    s_sum += s[i - 1];
  }
  // Ét baselinepunkt: ingen par, intet estimat → NaN (som i.ts og qicharts2 NA)
  let sbar: number = s_sum / s.length;

  // Screening: behold s_i < 3.2665·s̄_raw, genberegn. Springes over ved s̄ = 0
  // (konstant serie), hvor alle s_i ville ryge ud og give 0/0.
  if (!args.outliers_in_limits && sbar > 0) {
    const uls: number = 3.2665 * sbar;
    let kept_sum: number = 0;
    let kept_count: number = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] < uls) {
        kept_sum += s[i];
        kept_count += 1;
      }
    }
    // Kan matematisk ikke blive 0 (s̄ ≥ min s), men falder sikkert tilbage.
    if (kept_count > 0) {
      sbar = kept_sum / kept_count;
    }
  }

  // Samme felter i samme rækkefølge som i.ts: calculateLimits konkatenerer
  // faser efter Object.entries-index.
  const rtn: controlLimitsObject = {
    keys: args.keys,
    values: new Array<number>(n),
    numerators: useRatio ? args.numerators : undefined,
    denominators: useRatio ? args.denominators : undefined,
    targets: new Array<number>(n),
    ll99: new Array<number>(n),
    ul99: new Array<number>(n)
  };

  const three_sbar: number = 3 * sbar;
  for (let i = 0; i < n; i++) {
    rtn.values[i] = value(i);
    rtn.targets[i] = cl;
    // Punktvis bredde med punktets egen nævner: 3·s̄/√d_i
    const half_width: number = three_sbar / Math.sqrt(denom(i));
    rtn.ll99![i] = cl - half_width;
    rtn.ul99![i] = cl + half_width;
  }

  return rtn;
}
