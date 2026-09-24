import isNullOrUndefined from "./isNullOrUndefined";
import type { Visual } from "../visual";

/**
 * Det antal decimaler, der skal til, for at aksens mærker kan skelnes.
 *
 * Indstillingen er et minimum. Med 0 decimaler bliver mærkerne 0,002, 0,004
 * og 0,006 til "0", "0" og "0" — tre ens tal på en akse, der ser ud, som om
 * den er i stykker. Afstanden mellem mærkerne afgør, hvor mange decimaler
 * der mindst skal til: et trin på 0,002 kræver tre.
 */
export function decimalsForTicks(configured: number, ticks: readonly number[]): number {
  if (ticks.length < 2) {
    return configured;
  }
  const step: number = Math.abs(ticks[1] - ticks[0]);
  if (!(step > 0) || !Number.isFinite(step)) {
    return configured;
  }
  // Den lille tilføjelse tager højde for flydende tal: log10(0,001) er ikke
  // altid præcis -3.
  const needed: number = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  return Math.max(configured, needed);
}

/**
 * Antal decimaler på y-aksen og på de etiketter, der læses sammen med den
 * (nuværende niveau og udviklingsmål). Én kilde, så de to aldrig er uenige.
 */
export default function yAxisDecimals(visualObj: Visual): number {
  const settings = visualObj.viewModel.inputSettings.settings[0];
  const configured: number = isNullOrUndefined(settings.y_axis.ylimit_sig_figs)
                               ? settings.spc.sig_figs
                               : settings.y_axis.ylimit_sig_figs;
  // Samme mærker, som aksen selv tegner: d3-aksen spørger skalaen med samme
  // antal.
  const scale = visualObj.plotProperties.yScale as unknown as { ticks?: (count?: number) => number[] };
  const count: number | undefined = visualObj.plotProperties.yAxis.tick_count || undefined;
  return decimalsForTicks(configured, scale.ticks?.(count) ?? []);
}
