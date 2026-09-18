import type derivedSettingsClass from "../Classes/derivedSettingsClass";

/**
 * Advarsel, når de bundne data ikke passer til den valgte diagramtype.
 *
 * En forkert valgt diagramtype er matematisk forkert uden at se forkert ud:
 * grænserne bliver beregnet efter en anden model end datas, og diagrammet
 * tegnes uden en eneste fejl. Denne funktion fanger det tilfælde, hvor
 * uoverensstemmelsen kan afgøres ud fra, hvad brugeren har bundet — ikke ud
 * fra en vurdering af tallene.
 *
 * Kun én regel, fordi kun én er entydig: en bundet nævner, som diagramtypen
 * slet ikke læser. De øvrige typer bruger nævneren — også `i`, `run` og `mr`,
 * der regner værdien som forholdet tæller/nævner (se `i.ts`). At tegne et
 * forhold som enkeltmålinger er et legitimt valg, ikke en fejl, og udløser
 * derfor ingen advarsel.
 *
 * Det modsatte tilfælde — en diagramtype, der kræver en nævner, uden at der
 * er en — er allerede en fejl i `validateDataViewColumns`.
 */
export default function chartTypeWarning(denominatorsPresent: boolean,
                                         chart_type_props: derivedSettingsClass["chart_type_props"]): string {
  const usesDenominator: boolean = chart_type_props.needs_denominator
                                   || chart_type_props.denominator_optional;

  if (denominatorsPresent && !usesDenominator) {
    return "Nævneren bruges ikke af den valgte diagramtype. Overvej Rate (U') eller Procent (P').";
  }

  return "";
}
