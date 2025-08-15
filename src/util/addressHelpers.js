/**
 * Utility functions for parsing address components from location data
 */

/**
 * Parse address components from a location object
 *
 * @param {Object} location - Location object from LocationAutocompleteInput
 * @param {Object} location.selectedPlace - Selected place object
 * @param {string} location.selectedPlace.address - Full address string
 * @returns {Object} Object containing city, state, and postalCode
 */
export const parseAddressComponents = (location) => {
  if (!location?.selectedPlace?.address) {
    return { city: '', state: '', postalCode: '' };
  }

  const address = location.selectedPlace.address;

  // Split address by commas and clean up whitespace
  const parts = address.split(',').map((part) => part.trim());

  let city = '';
  let state = '';
  let postalCode = '';

  // Handle different address formats:
  // 1. "Street Address, City, State ZIP"
  // 2. "City, State ZIP"
  // 3. "City, State"
  // 4. "Street Address, City, State"
  // 5. "City, Country" (international)

  if (parts.length >= 3) {
    // Format: "Street Address, City, State ZIP" or "Street Address, City, State"
    const lastPart = parts[parts.length - 1];
    const secondLastPart = parts[parts.length - 2];

    // Check if last part contains ZIP code (5 digits or 5+4 format)
    const zipCodeMatch = lastPart.match(/(\d{5}(?:-\d{4})?)/);

    if (zipCodeMatch) {
      postalCode = zipCodeMatch[1];
      // Remove ZIP from the part
      const statePart = lastPart.replace(zipCodeMatch[1], '').trim();
      state = statePart;
      city = secondLastPart;
    } else {
      // No ZIP code found, assume last part is state
      state = lastPart;
      city = secondLastPart;
    }
  } else if (parts.length === 2) {
    // Format: "City, State ZIP" or "City, State"
    const lastPart = parts[1];
    const firstPart = parts[0];

    // Check if last part contains ZIP code
    const zipCodeMatch = lastPart.match(/(\d{5}(?:-\d{4})?)/);

    if (zipCodeMatch) {
      postalCode = zipCodeMatch[1];
      // Remove ZIP from the part
      const statePart = lastPart.replace(zipCodeMatch[1], '').trim();
      state = statePart;
      city = firstPart;
    } else {
      // No ZIP code found, assume last part is state
      state = lastPart;
      city = firstPart;
    }
  } else if (parts.length === 1) {
    // Single part - could be just city or city with state
    const singlePart = parts[0];

    // Check for state pattern (2-3 letter state code)
    const stateMatch = singlePart.match(/\s+([A-Z]{2,3})\s*$/);

    if (stateMatch) {
      state = stateMatch[1];
      city = singlePart.replace(stateMatch[0], '').trim();
    } else {
      // Check for ZIP code in single part
      const zipCodeMatch = singlePart.match(/(\d{5}(?:-\d{4})?)/);
      if (zipCodeMatch) {
        postalCode = zipCodeMatch[1];
        city = singlePart.replace(zipCodeMatch[1], '').trim();
      } else {
        city = singlePart;
      }
    }
  }

  // Clean up any remaining commas or extra spaces
  city = city.replace(/^,+|,+$/g, '').trim();
  state = state.replace(/^,+|,+$/g, '').trim();
  postalCode = postalCode.replace(/^,+|,+$/g, '').trim();

  return { city, state, postalCode };
};
