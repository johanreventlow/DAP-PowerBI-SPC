import type derivedSettingsClass from "../Classes/derivedSettingsClass";
import isNullOrUndefined from "./isNullOrUndefined";

export type ValidationT = { status: number, messages: string[], error?: string };

const enum ValidationFailTypes {
  Valid = 0,
  GroupingMissing = 1,
  DateMissing = 2,
  NumeratorMissing = 3,
  NumeratorNegative = 4,
  DenominatorMissing = 5,
  DenominatorNegative = 6,
  DenominatorLessThanNumerator = 7,
  SDMissing = 8,
  SDNegative = 9,
  NumeratorNaN = 10,
  DenominatorNaN = 11,
  SDNaN = 12,
  DenominatorLessThanOne = 13
}

function validateInputDataImpl(key: string | undefined,
                              numerator: number | undefined,
                              denominator: number | undefined,
                              xbar_sd: number | undefined,
                              chart_type_props: derivedSettingsClass["chart_type_props"],
                              check_denom: boolean): { message: string, type: ValidationFailTypes }  {

  const rtn = { message: "", type: ValidationFailTypes.Valid };
  if (isNullOrUndefined(key)) {
    rtn.message = "Dato mangler";
    rtn.type = ValidationFailTypes.DateMissing;
  }

  if (isNullOrUndefined(numerator)) {
    rtn.message = "Tæller mangler";
    rtn.type = ValidationFailTypes.NumeratorMissing;
  } else {
    if (isNaN(numerator)) {
      rtn.message = "Tæller er ikke et tal";
      rtn.type = ValidationFailTypes.NumeratorNaN;
    }

    if (chart_type_props.numerator_non_negative && numerator < 0) {
      rtn.message = "Tæller er negativ";
      rtn.type = ValidationFailTypes.NumeratorNegative;
    }
  }

  if (check_denom) {
    if (isNullOrUndefined(denominator)) {
      rtn.message = "Nævner mangler";
      rtn.type = ValidationFailTypes.DenominatorMissing;
    } else if (isNaN(denominator)) {
      rtn.message = "Nævner er ikke et tal";
      rtn.type = ValidationFailTypes.DenominatorNaN;
    } else if (denominator < 0) {
      rtn.message = "Nævner er negativ";
      rtn.type = ValidationFailTypes.DenominatorNegative;
    } else if (chart_type_props.numerator_leq_denominator && !isNullOrUndefined(numerator) && denominator < numerator) {
      rtn.message = "Nævner er mindre end tæller";
      rtn.type = ValidationFailTypes.DenominatorLessThanNumerator;
    } else if (chart_type_props.denominator_gt_one && denominator <= 1) {
      rtn.message = "Nævner er højst 1"
      rtn.type = ValidationFailTypes.DenominatorLessThanOne
    }
  }

  if (chart_type_props.needs_sd) {
    if (isNullOrUndefined(xbar_sd)) {
      rtn.message = "SD mangler";
      rtn.type = ValidationFailTypes.SDMissing;
    } else if (isNaN(xbar_sd) && !isNullOrUndefined(numerator)) {
      rtn.message = "SD er ikke et tal";
      rtn.type = ValidationFailTypes.SDNaN;
    } else if (xbar_sd < 0) {
      rtn.message = "SD er negativ";
      rtn.type = ValidationFailTypes.SDNegative;
    }
  }
  return rtn;
}

// ESLint errors due to number of lines in function, but would reduce readability to separate further

export default function validateInputData(keys: (string | undefined)[],
                                          numerators: (number | undefined)[],
                                          denominators: (number | undefined)[] | undefined,
                                          xbar_sds: (number | undefined)[] | undefined,
                                          chart_type_props: derivedSettingsClass["chart_type_props"],
                                          idxs: number[]): { status: number, messages: string[], error?: string } {
  let allSameType: boolean = false;
  let messages: string[] = new Array<string>();
  let all_status: ValidationFailTypes[] = new Array<ValidationFailTypes>();
  const check_denom = chart_type_props.needs_denominator
                      || (chart_type_props.denominator_optional && !isNullOrUndefined(denominators) && denominators.length > 0);
  const n: number = idxs.length;
  for (let i = 0; i < n; i++) {
    const validation = validateInputDataImpl(keys[i], numerators?.[i], denominators?.[i], xbar_sds?.[i], chart_type_props,  check_denom);
    messages.push(validation.message);
    all_status.push(validation.type);
  }

  let allSameTypeSet = new Set(all_status);
  allSameType = allSameTypeSet.size === 1;
  let commonType = Array.from(allSameTypeSet)[0];

  let validationRtn: ValidationT = {
    status: (allSameType && commonType !== ValidationFailTypes.Valid) ? 1 : 0,
    messages: messages
  };

  // If all data has failed, but for different reasons, return a generic error
  if (validationRtn.status === 0) {
    const allInvalid: boolean = all_status.every(d => d !== ValidationFailTypes.Valid);
    if (allInvalid) {
      validationRtn.status = 1; // All data invalid
      validationRtn.error = "Ingen gyldige data fundet.";
      return validationRtn;
    }
  }

  if (allSameType && commonType !== ValidationFailTypes.Valid) {
    switch(commonType) {
      case ValidationFailTypes.GroupingMissing: {
        validationRtn.error = "Gruppering mangler."
        break;
      }
      case ValidationFailTypes.DateMissing: {
        validationRtn.error = "Alle datoer/nøgler mangler."
        break;
      }
      case ValidationFailTypes.NumeratorMissing: {
        validationRtn.error = "Alle tællere mangler."
        break;
      }
      case ValidationFailTypes.NumeratorNaN: {
        validationRtn.error = "Ingen af tællerne er tal."
        break;
      }
      case ValidationFailTypes.NumeratorNegative: {
        validationRtn.error = "Alle tællere er negative."
        break;
      }
      case ValidationFailTypes.DenominatorMissing: {
        validationRtn.error = "Alle nævnere mangler."
        break;
      }
      case ValidationFailTypes.DenominatorNaN: {
        validationRtn.error = "Ingen af nævnerne er tal."
        break;
      }
      case ValidationFailTypes.DenominatorNegative: {
        validationRtn.error = "Alle nævnere er negative."
        break;
      }
      case ValidationFailTypes.DenominatorLessThanNumerator: {
        validationRtn.error = "Alle nævnere er mindre end tællerne.";
        break;
      }
      case ValidationFailTypes.SDMissing: {
        validationRtn.error = "Alle SD-værdier mangler.";
        break;
      }
      case ValidationFailTypes.SDNaN: {
        validationRtn.error = "Ingen af SD-værdierne er tal.";
        break;
      }
      case ValidationFailTypes.SDNegative: {
        validationRtn.error = "Alle SD-værdier er negative.";
        break;
      }
      case ValidationFailTypes.DenominatorLessThanOne: {
        validationRtn.error = "Alle nævnere er højst 1.";
        break;
      }
    }
  }
  return validationRtn;
}
