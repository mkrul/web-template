import toPairs from 'lodash/toPairs';
import { types as sdkTypes } from './sdkLoader';
import { diffInTime } from './dates';
import { extractYouTubeID } from './string';

const { LatLng, Money } = sdkTypes;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 256;

const isNonEmptyString = (val) => {
  return typeof val === 'string' && val.trim().length > 0;
};

/**
 * Validator functions and helpers for Final Forms
 */

// Final Form expects and undefined value for a successful validation
const VALID = undefined;

export const required = (message) => (value) => {
  if (typeof value === 'undefined' || value === null) {
    // undefined or null values are invalid
    return message;
  }
  if (typeof value === 'string') {
    // string must be nonempty when trimmed
    return isNonEmptyString(value) ? VALID : message;
  }
  return VALID;
};

export const requiredStringNoTrim = (message) => (value) => {
  return typeof value === 'string' && value.length > 0 ? VALID : message;
};

// DEPRECATED in favor of required
export const requiredBoolean = (message) => (value) => {
  return typeof value === 'boolean' ? VALID : message;
};

// DEPRECATED in favor of required
export const requiredAndNonEmptyString = (message) => (value) => {
  return isNonEmptyString(value) ? VALID : message;
};

/**
 * Validates that a string is unique in an array of strings.
 * @param {Array<string>} stringArray - Array of strings to check against.
 * @param {Function} getMessage - Function that returns an error message.
 * @param {Function} toSlug - Function that converts a string to a slug.
 * @returns {string} - VALID if the string is unique, otherwise the error message.
 */
export const uniqueString =
  (currentIndex, stringArray, getMessage, toSlug) => (value) => {
    if (typeof value === 'undefined' || value === null) {
      // undefined or null values are invalid
      return getMessage('', '');
    }
    const slug = toSlug(value);
    const otherSlugs = stringArray
      .map(toSlug)
      .filter((_, i) => i !== currentIndex);
    const isUnique = !otherSlugs.includes(slug);
    return isUnique ? VALID : getMessage(value, slug);
  };

export const requiredFieldArrayCheckbox = (message) => (value) => {
  if (!value) {
    return message;
  }

  const entries = toPairs(value);
  const hasSelectedValues = entries.filter((e) => !!e[1]).length > 0;
  return hasSelectedValues ? VALID : message;
};

export const requiredSelectTreeOption = (message) => (value) => {
  if (
    typeof value === 'undefined' ||
    value === null ||
    Object.values(value)?.length === 0
  ) {
    return message;
  }
};

export const minLength = (message, minimumLength) => (value) => {
  const hasLength = value && typeof value.length === 'number';
  return hasLength && value.length >= minimumLength ? VALID : message;
};

export const maxLength = (message, maximumLength) => (value) => {
  if (!value) {
    return VALID;
  }
  const hasLength = value && typeof value.length === 'number';
  return hasLength && value.length <= maximumLength ? VALID : message;
};

export const nonEmptyArray = (message) => (value) => {
  return value && Array.isArray(value) && value.length > 0 ? VALID : message;
};

export const requiredCratePhotos = (message, crateType) => (value) => {
  const isValidArray = value && Array.isArray(value);

  if (!isValidArray) {
    return message;
  }

  // Different photo requirements based on crate type
  let minPhotos, maxPhotos;
  if (crateType === 'wire') {
    minPhotos = 3;
    maxPhotos = 4;
  } else if (crateType === 'solid') {
    minPhotos = 6;
    maxPhotos = 7;
  } else {
    // Default fallback (if no crate type selected yet)
    minPhotos = 3;
    maxPhotos = 7;
  }

  // Allow submission even when below minimum so users can save image removals
  // Only enforce maximum limit to prevent excessive uploads
  const hasValidLength = value.length <= maxPhotos;
  return hasValidLength ? VALID : message;
};

export const autocompleteSearchRequired = (message) => (value) => {
  return value && value.search ? VALID : message;
};

export const autocompletePlaceSelected = (message) => (value) => {
  const selectedPlaceIsValid =
    value &&
    value.selectedPlace &&
    value.selectedPlace.address &&
    value.selectedPlace.origin instanceof LatLng;
  return selectedPlaceIsValid ? VALID : message;
};

export const bookingDateRequired = (inValidDateMessage) => (value) => {
  const dateIsValid = value && value.date instanceof Date;
  return !dateIsValid ? inValidDateMessage : VALID;
};

export const bookingDatesRequired =
  (inValidStartDateMessage, inValidEndDateMessage) => (value) => {
    const startDateIsValid = value && value.startDate instanceof Date;
    const endDateIsValid = value && value.endDate instanceof Date;

    if (!startDateIsValid) {
      return inValidStartDateMessage;
    } else if (!endDateIsValid) {
      return inValidEndDateMessage;
    } else {
      return VALID;
    }
  };

// Source: http://www.regular-expressions.info/email.html
// See the link above for an explanation of the tradeoffs.
const EMAIL_RE = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export const emailFormatValid = (message) => (value) => {
  return value && EMAIL_RE.test(value) ? VALID : message;
};

export const moneySubUnitAmountAtLeast = (message, minValue) => (value) => {
  return value instanceof Money && value.amount >= minValue ? VALID : message;
};

const parseNum = (str) => {
  const num = Number.parseInt(str, 10);
  return Number.isNaN(num) ? null : num;
};

export const numberAtLeast = (message, minNumber) => (value) => {
  const valueNum = parseNum(value);
  return typeof valueNum === 'number' && valueNum >= minNumber
    ? VALID
    : message;
};

export const validateInteger = (
  value,
  max,
  min,
  numberTooSmallMessage,
  numberTooBigMessage
) => {
  const parsedValue = Number.parseInt(value, 10);
  if (parsedValue > max) {
    return numberTooBigMessage;
  }
  if (parsedValue < min) {
    return numberTooSmallMessage;
  }
  return VALID;
};

// If URL is passed to this function as null, will return VALID
export const validateYoutubeURL = (url, message) => {
  return url ? (extractYouTubeID(url) ? VALID : message) : VALID;
};

export const ageAtLeast = (message, minYears) => (value) => {
  const { year, month, day } = value;
  const dayNum = parseNum(day);
  const monthNum = parseNum(month);
  const yearNum = parseNum(year);

  // day, month, and year needs to be numbers
  if (dayNum !== null && monthNum !== null && yearNum !== null) {
    const now = new Date();
    const age = new Date(yearNum, monthNum - 1, dayNum);
    const ageInYears = diffInTime(now, age, 'years', true);

    return age && age instanceof Date && ageInYears >= minYears
      ? VALID
      : message;
  }
  return message;
};

export const validBusinessURL = (message) => (value) => {
  if (typeof value === 'undefined' || value === null) {
    return message;
  }

  const disallowedChars = /[^-A-Za-z0-9+&@#/%?=~_|!:,.;()]/;
  const protocolTokens = value.split(':');
  const includesProtocol = protocolTokens.length > 1;
  const usesHttpProtocol =
    includesProtocol && !!protocolTokens[0].match(/^(https?)/);

  const invalidCharacters = !!value.match(disallowedChars);
  const invalidProtocol = !(usesHttpProtocol || !includesProtocol);
  // Stripe checks against example.com
  const isExampleDotCom = !!value.match(
    /^(https?:\/\/example\.com|example\.com)/
  );
  const isLocalhost = !!value.match(
    /^(https?:\/\/localhost($|:|\/)|localhost($|:|\/))/
  );
  return invalidCharacters || invalidProtocol || isExampleDotCom || isLocalhost
    ? message
    : VALID;
};

export const validSsnLast4 = (message) => (value) => {
  return value.length === 4 ? VALID : message;
};

export const validHKID = (message) => (value) => {
  // Accept value 000000000 for testing Stripe
  if (value.length === 9 && value.match(/([0]{9})/)) {
    return VALID;
  }

  // HKID format example: AB364912(5)
  // ID can start with one or two letters and the check digit in the end can be in brackets or not
  if (value.length < 8) {
    return message;
  }

  // Handle possible brackets in value
  if (
    value.charAt(value.length - 3) === '(' &&
    value.charAt(value.length - 1) === ')'
  ) {
    value =
      value.substring(0, value.length - 3) + value.charAt(value.length - 2);
  }
  value = value.toUpperCase();

  // Check that pattern is correct and split value to array
  const hkidPattern = /^([A-Z]{1,2})([0-9]{6})([A0-9])$/;
  const matchArray = value.match(hkidPattern);

  if (!matchArray) {
    return message;
  }

  const charPart = matchArray[1];
  const numPart = matchArray[2];
  const checkDigit = matchArray[3];

  // Calculate the checksum for character part.
  // Transfer letters to numbers so that A=10, B=11, C=12 etc.
  // If there is only one letter in the ID use 36 as the first value
  // Total calculation is weighted so that 1st digit is x9, 2nd digit x8, 3rd digit x7 etc.

  const strValidChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let checkSum = 0;

  if (charPart.length === 2) {
    checkSum += 9 * (10 + strValidChars.indexOf(charPart.charAt(0)));
    checkSum += 8 * (10 + strValidChars.indexOf(charPart.charAt(1)));
  } else {
    checkSum += 9 * 36;
    checkSum += 8 * (10 + strValidChars.indexOf(charPart));
  }

  // Calculate the checksum for numeric part

  for (let i = 0, j = 7; i < numPart.length; i++, j--) {
    checkSum += j * numPart.charAt(i);
  }

  // Verify the check digit
  const remaining = checkSum % 11;
  let verify = remaining === 0 ? 0 : 11 - remaining;
  verify = verify.toString();
  const isValid =
    verify === checkDigit || (verify === 10 && checkDigit === 'A');

  return isValid ? VALID : message;
};

export const validSGID = (message) => (value) => {
  return value.length === 9 ? VALID : message;
};

export const composeValidators =
  (...validators) =>
  (value) =>
    validators.reduce((error, validator) => error || validator(value), VALID);
