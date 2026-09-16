import { describe, it, expect } from "vitest";
import ipLimits from "../../src/Limit Calculations/ip";
import iLimits from "../../src/Limit Calculations/i";
import type { controlLimitsArgs, controlLimitsObject } from "../../src/Classes/viewModelClass";
import fixturesJson from "./ip-fixtures.json";

// Enhedstests for I′-beregningen (normaliseret individkort). Referencen er
// qicharts2 v0.8.1 `chart = "ip"`; fixtures er genereret af ip-fixtures-gen.R.
// Grænserne skal reproduceres eksakt (ingen baseline i fixtures, jf.
// design.md D1); resten er håndberegnede egenskaber ved formlerne.

const SQRT_HALF_PI: number = Math.sqrt(Math.PI / 2);

function makeArgs(numerators: number[], denominators?: number[],
                  subset?: number[], outliers_in_limits: boolean = true): controlLimitsArgs {
  const keys = numerators.map((_, i) => ({ x: i, id: i, label: String(i + 1) }));
  const subset_points: number[] = subset ?? numerators.map((_, i) => i);
  return denominators
    ? { keys, numerators, denominators, subset_points, outliers_in_limits }
    : { keys, numerators, subset_points, outliers_in_limits };
}

function widths(limits: controlLimitsObject): number[] {
  return limits.ul99!.map((u, i) => (u as number) - (limits.targets[i] as number));
}

function expectAllFinite(limits: controlLimitsObject): void {
  for (const line of ["values", "targets", "ll99", "ul99"] as const) {
    for (const v of limits[line]!) {
      expect(Number.isFinite(v), line).toBe(true);
    }
  }
}

describe("ipLimits — formlerne", () => {
  it("bruger d_i = 1 uden nævner og giver konstante grænser", () => {
    const y: number[] = [2.3, -0.4, 1.7, 3.1, 0.2, -1.5, 2.8];
    const limits = ipLimits(makeArgs(y));
    const mean: number = y.reduce((a, b) => a + b, 0) / y.length;
    let sbar: number = 0;
    for (let i = 1; i < y.length; i++) {
      sbar += SQRT_HALF_PI * Math.abs(y[i] - y[i - 1]) / Math.sqrt(2);
    }
    sbar /= y.length - 1;
    expect(limits.values).toEqual(y);
    expect(limits.numerators).toBeUndefined();
    expect(limits.denominators).toBeUndefined();
    for (let i = 0; i < y.length; i++) {
      expect(limits.targets[i]).toBeCloseTo(mean, 12);
      expect(limits.ul99![i]).toBeCloseTo(mean + 3 * sbar, 12);
      expect(limits.ll99![i]).toBeCloseTo(mean - 3 * sbar, 12);
    }
    // Ingen afskæring ved 0: LCL må være negativ.
    expect(limits.ll99![0]).toBeLessThan(0);
  });

  // Sigma-faktor ved d = 1: √(π/2)/√2 = √π/2 = 0.88623 mod 1/1.128 = 0.88652,
  // relativ forskel 3,3·10⁻⁴.
  // outliers_in_limits = true, så I-kortets 3.267 mod I′'s 3.2665 ikke kan
  // flippe en grænseværdi.
  it("svarer til I-kortet inden for 5e-4 relativt, når d_i = 1", () => {
    const y: number[] = [10, 11, 10, 12, 11, 10, 11, 12, 10, 11, 14, 9, 13];
    const ip = ipLimits(makeArgs(y));
    const i = iLimits(makeArgs(y));
    const ipWidth: number[] = widths(ip);
    const iWidth: number[] = widths(i);
    for (let k = 0; k < y.length; k++) {
      expect(ip.targets[k]).toBeCloseTo(i.targets[k] as number, 12);
      expect(Math.abs(ipWidth[k] / iWidth[k] - 1)).toBeLessThan(5e-4);
      expect(ipWidth[k]).not.toBeCloseTo(iWidth[k], 12); // eksakt √(π/2), ikke 1.128
    }
  });

  it("giver konstante grænser ved konstant nævner", () => {
    const limits = ipLimits(makeArgs([4, 8, 6, 10], [2, 2, 2, 2]));
    const w: number[] = widths(limits);
    // CL = 28/8; s_i = √(π/2)·|Δy|/√(1/2+1/2); s̄ = √(π/2)·(2+1+2)/3; SD = s̄/√2
    const sbar: number = SQRT_HALF_PI * 5 / 3;
    for (let i = 0; i < 4; i++) {
      expect(limits.targets[i]).toBeCloseTo(3.5, 12);
      expect(w[i]).toBeCloseTo(3 * sbar / Math.sqrt(2), 12);
    }
    expect(limits.numerators).toEqual([4, 8, 6, 10]);
    expect(limits.denominators).toEqual([2, 2, 2, 2]);
  });

  it("skalerer grænseafstanden som 1/√d_i: d_B = 4·d_A giver halv bredde", () => {
    const limits = ipLimits(makeArgs([5, 22, 7, 19, 6], [2, 8, 2, 8, 3]));
    const w: number[] = widths(limits);
    expect(w[1]).toBeCloseTo(w[0] / 2, 12);
    expect(w[3]).toBeCloseTo(w[2] / 2, 12);
    expect(w[4]).toBeCloseTo(w[0] * Math.sqrt(2 / 3), 12);
    // Nedre grænse spejler den øvre
    for (let i = 0; i < 5; i++) {
      expect((limits.targets[i] as number) - (limits.ll99![i] as number)).toBeCloseTo(w[i], 12);
    }
  });

  it("bruger vægtet centerlinje Σn/Σd, ikke gennemsnittet af ratioerne", () => {
    const limits = ipLimits(makeArgs([1, 4, 2, 18], [4, 8, 4, 20]));
    expect(limits.targets[0]).toBeCloseTo(25 / 36, 12);
    expect(limits.targets[0]).not.toBeCloseTo(0.5375, 3);
    expect(limits.values).toEqual([0.25, 0.5, 0.5, 0.9]);
  });

  it("screener store s_i, når outliers_in_limits er false", () => {
    const y: number[] = [10, 11, 10, 12, 11, 10, 11, 12, 10, 11, 40, 11, 10, 12, 11, 10];
    const all = ipLimits(makeArgs(y, undefined, undefined, true));
    const screened = ipLimits(makeArgs(y, undefined, undefined, false));
    // Håndberegning: s_i = √(π/2)·|Δy|/√2; to differencer på 29 og 30 er de eneste over ULS.
    const s: number[] = [];
    for (let i = 1; i < y.length; i++) {
      s.push(SQRT_HALF_PI * Math.abs(y[i] - y[i - 1]) / Math.sqrt(2));
    }
    const sbarRaw: number = s.reduce((a, b) => a + b, 0) / s.length;
    const kept: number[] = s.filter(v => v < 3.2665 * sbarRaw);
    expect(kept.length).toBe(s.length - 2);
    const sbarScreened: number = kept.reduce((a, b) => a + b, 0) / kept.length;
    expect(widths(all)[0]).toBeCloseTo(3 * sbarRaw, 12);
    expect(widths(screened)[0]).toBeCloseTo(3 * sbarScreened, 12);
    expect(widths(screened)[0]).toBeLessThan(widths(all)[0]);
    expect(screened.targets[0]).toBeCloseTo(all.targets[0] as number, 12);
  });

  // Cycle 3 L4: screeningen beholder s_i < ULS (streng, som qicharts2). Serien
  // er konstrueret, så den sidste s_i rammer ULS eksakt i flydende tal:
  // med d = 1 er s_i ∝ |Δy|; differencer [1,1,1,1,a] og a = 3.2665·(4+a)/5
  // giver a = 3.2665·4/(5 − 3.2665). Et skift til <= beholder alle fem.
  it("screener en s_i, der er præcis lig ULS, bort", () => {
    const a: number = 3.2665 * 4 / (5 - 3.2665);
    const y: number[] = [0, 1, 2, 3, 4, 4 + a];
    // Samme operationsorden som ip.ts, ellers afviger sidste s_i med 1 ulp.
    const s: number[] = [];
    for (let i = 1; i < y.length; i++) {
      s.push(SQRT_HALF_PI * Math.abs(y[i] - y[i - 1]) / Math.sqrt(2));
    }
    let sum: number = 0;
    for (const v of s) {
      sum += v;
    }
    const sbarRaw: number = sum / 5;
    expect(s[4]).toBe(3.2665 * sbarRaw); // konstruktionen holder eksakt
    const screened = ipLimits(makeArgs(y, undefined, undefined, false));
    const all = ipLimits(makeArgs(y, undefined, undefined, true));
    expect(widths(screened)[0]).toBeCloseTo(3 * s[0], 12); // kun de fire ens s_i tilbage
    expect(widths(all)[0]).toBeCloseTo(3 * sbarRaw, 12);
  });

  it.each([true, false])("håndterer en konstant serie uden NaN (outliers_in_limits=%s)", keep => {
    // Alle ratioer er 5: tæller = 5·nævner, så CL = 65/13 = 5 og alle s_i = 0.
    const limits = ipLimits(makeArgs([10, 15, 10, 25, 5], [2, 3, 2, 5, 1], undefined, keep));
    expectAllFinite(limits);
    for (let i = 0; i < 5; i++) {
      expect(limits.ll99![i]).toBe(limits.targets[i]);
      expect(limits.ul99![i]).toBe(limits.targets[i]);
      expect(limits.targets[i]).toBe(5);
    }
  });

  it("fryser CL og s̄ på baselinen, men bruger punktets egen nævner til bredden", () => {
    const num: number[] = [10, 12, 11, 13, 30, 9];
    const den: number[] = [2, 3, 2, 4, 1, 9];
    const baseline: number[] = [0, 1, 2, 3];
    const withLater = ipLimits(makeArgs(num, den, baseline));
    const onlyBaseline = ipLimits(makeArgs(num.slice(0, 4), den.slice(0, 4)));
    const cl: number = onlyBaseline.targets[0] as number;
    const sbar3: number = widths(onlyBaseline)[0] * Math.sqrt(den[0]); // 3·s̄
    for (let i = 0; i < 6; i++) {
      expect(withLater.targets[i]).toBeCloseTo(cl, 12);
      expect(widths(withLater)[i]).toBeCloseTo(sbar3 / Math.sqrt(den[i]), 12);
    }
    // Et ændret punkt uden for baselinen rører hverken CL eller s̄
    const changed = ipLimits(makeArgs([10, 12, 11, 13, 300, 9], den, baseline));
    expect(changed.targets[4]).toBeCloseTo(cl, 12);
    expect(widths(changed)[4]).toBeCloseTo(sbar3, 12);
  });

  it("beregner baselinen fra slutningen, når subset_points peger dér", () => {
    const num: number[] = [1, 50, 10, 12, 11, 13];
    const den: number[] = [1, 1, 2, 3, 2, 4];
    const fromEnd = ipLimits(makeArgs(num, den, [2, 3, 4, 5]));
    const tail = ipLimits(makeArgs(num.slice(2), den.slice(2)));
    expect(fromEnd.targets[0]).toBeCloseTo(tail.targets[0] as number, 12);
    expect(widths(fromEnd)[2]).toBeCloseTo(widths(tail)[0], 12);
  });

  it("giver udefinerede grænser men endelige værdier med ét baselinepunkt", () => {
    const limits = ipLimits(makeArgs([3, 4, 5], [1, 2, 1], [0]));
    expect(limits.values).toEqual([3, 2, 5]);
    expect(limits.targets[0]).toBe(3);
    for (let i = 0; i < 3; i++) {
      expect(Number.isFinite(limits.ll99![i])).toBe(false);
      expect(Number.isFinite(limits.ul99![i])).toBe(false);
    }
  });

  it("returnerer nøjagtig samme felter i samme rækkefølge som I-kortet", () => {
    const ipKeys: string[] = Object.keys(ipLimits(makeArgs([1, 2, 3])));
    const iKeys: string[] = Object.keys(iLimits(makeArgs([1, 2, 3])));
    expect(ipKeys).toEqual(iKeys);
    const ipKeysRatio: string[] = Object.keys(ipLimits(makeArgs([1, 2, 3], [1, 1, 1])));
    expect(ipKeysRatio).toEqual(iKeys);
  });
});

type fixtureVariant = {
  outliers_in_limits: boolean;
  cl: number[];
  lcl: number[];
  ucl: number[];
  sigma_signal: boolean[];
  runs_signal: boolean[];
  part: number[];
};
type fixture = {
  name: string;
  description: string;
  keys: string[];
  numerators: number[];
  denominators: number[] | null;
  variants: fixtureVariant[];
};

const fixtures: fixture[] = (fixturesJson as { fixtures: fixture[] }).fixtures;

describe("ipLimits — qicharts2-fixtures", () => {
  it("fixture-sanity: dækker de krævede scenarier", () => {
    const names: string[] = fixtures.map(f => f.name);
    expect(names).toEqual(expect.arrayContaining([
      "continuous_no_denominator", "aggregated_means",
      "proportion_varying_denominator", "extreme_difference", "two_phases"
    ]));
    expect(fixtures.every(f => f.variants.length === 2)).toBe(true);
  });

  fixtures.forEach(fx => {
    fx.variants.forEach(variant => {
      it(`${fx.name} (outliers_in_limits=${variant.outliers_in_limits}) matcher qicharts2`, () => {
        // Faser beregnes hver for sig, som viewModelClass.calculateLimits gør.
        const parts: number[] = Array.from(new Set(variant.part));
        parts.forEach(part => {
          const idx: number[] = variant.part.map((p, i) => p === part ? i : -1).filter(i => i >= 0);
          const limits = ipLimits(makeArgs(
            idx.map(i => fx.numerators[i]),
            fx.denominators ? idx.map(i => fx.denominators![i]) : undefined,
            undefined,
            variant.outliers_in_limits
          ));
          expectAllFinite(limits);
          idx.forEach((i, k) => {
            expect(limits.targets[k], `cl[${i}]`).toBeCloseTo(variant.cl[i], 10);
            expect(limits.ll99![k], `lcl[${i}]`).toBeCloseTo(variant.lcl[i], 10);
            expect(limits.ul99![k], `ucl[${i}]`).toBeCloseTo(variant.ucl[i], 10);
            const beyond: boolean = limits.values[k] > (limits.ul99![k] as number)
                                 || limits.values[k] < (limits.ll99![k] as number);
            expect(beyond, `sigma.signal[${i}]`).toBe(variant.sigma_signal[i]);
          });
        });
      });
    });
  });

  it("fixture-sanity: extreme_difference har smallere grænser med screening", () => {
    const fx = fixtures.find(f => f.name === "extreme_difference")!;
    const keep = fx.variants.find(v => v.outliers_in_limits)!;
    const screen = fx.variants.find(v => !v.outliers_in_limits)!;
    expect(screen.ucl[0]).toBeLessThan(keep.ucl[0]);
    expect(screen.cl[0]).toBe(keep.cl[0]);
  });
});
