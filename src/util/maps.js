import memoize from 'lodash/memoize';
import seedrandom from 'seedrandom';
import { types as sdkTypes } from './sdkLoader';

const { LatLng, LatLngBounds } = sdkTypes;

const EARTH_RADIUS = 6371000; /* meters  */
const DEG_TO_RAD = Math.PI / 180.0;
const THREE_PI = Math.PI * 3;
const TWO_PI = Math.PI * 2;

const degToRadians = (latlng) => {
  const { lat, lng } = latlng;
  const latR = lat * DEG_TO_RAD;
  const lngR = lng * DEG_TO_RAD;
  return { lat: latR, lng: lngR };
};

const radToDegrees = (latlngInRadians) => {
  const { lat: latR, lng: lngR } = latlngInRadians;
  const lat = latR / DEG_TO_RAD;
  const lng = lngR / DEG_TO_RAD;
  return { lat, lng };
};

/**
 * This obfuscatedCoordinatesImpl function is a temporary solution for the coordinate obfuscation.
 * In the future, improved version needs to have protectedData working and
 * available in accepted transaction.
 *
 * Based on:
 * https://gis.stackexchange.com/questions/25877/generating-random-locations-nearby#answer-213898
 */

const obfuscatedCoordinatesImpl = (latlng, fuzzyOffset, cacheKey) => {
  const { lat, lng } = degToRadians(latlng);
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);

  const randomizeBearing = cacheKey ? seedrandom(cacheKey)() : Math.random();
  const randomizeDistance = cacheKey
    ? seedrandom(cacheKey.split('').reverse().join(''))()
    : Math.random();

  // Randomize distance and bearing
  const distance = randomizeDistance * fuzzyOffset;
  const bearing = randomizeBearing * TWO_PI;
  const theta = distance / EARTH_RADIUS;
  const sinBearing = Math.sin(bearing);
  const cosBearing = Math.cos(bearing);
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);

  const newLat = Math.asin(sinLat * cosTheta + cosLat * sinTheta * cosBearing);
  const newLng =
    lng +
    Math.atan2(
      sinBearing * sinTheta * cosLat,
      cosTheta - sinLat * Math.sin(newLat)
    );

  // Normalize -PI -> +PI radians
  const newLngNormalized = ((newLng + THREE_PI) % TWO_PI) - Math.PI;

  const result = radToDegrees({ lat: newLat, lng: newLngNormalized });
  return new LatLng(result.lat, result.lng);
};

const obfuscationKeyGetter = (latlng, fuzzyOffset, cacheKey) => cacheKey;

const memoizedObfuscatedCoordinatesImpl = memoize(
  obfuscatedCoordinatesImpl,
  obfuscationKeyGetter
);

/**
 * Make the given coordinates randomly a little bit different.
 *
 * @param {LatLng} latlng coordinates
 * @param {number} fuzzyOffset configuration of how big offset should be used.
 * @param {String?} cacheKey if given, the results are memoized and
 * the same coordinates are returned for the same key as long as the
 * cache isn't cleared (e.g. with page refresh). This results in
 * e.g. same listings always getting the same obfuscated coordinates
 * if the listing id is used as the cache key.
 *
 * @return {LatLng} obfuscated coordinates
 */
export const obfuscatedCoordinates = (latlng, fuzzyOffset, cacheKey = null) => {
  return cacheKey
    ? memoizedObfuscatedCoordinatesImpl(latlng, fuzzyOffset, cacheKey)
    : obfuscatedCoordinatesImpl(latlng, fuzzyOffset);
};

/**
 * Query the user's current location from the browser API
 *
 * @return {Promise<LatLng>} user's current location
 */
export const userLocation = () =>
  new Promise((resolve, reject) => {
    const geolocationAvailable = 'geolocation' in navigator;

    if (!geolocationAvailable) {
      reject(new Error('Geolocation not available in browser'));
      return;
    }

    // Some defaults for user's current geolocation call
    // https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition
    // Note: without high accuracy, the given location might differ quite much.
    //       We decided that true would be better default for a template app.
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    const onSuccess = (position) =>
      resolve(new LatLng(position.coords.latitude, position.coords.longitude));

    const onError = (error) => reject(error);

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  });

/**
 * Calculate a circular polyline around the given point
 *
 * See: https://stackoverflow.com/questions/7316963/drawing-a-circle-google-static-maps
 *
 * @param {LatLng} latlng - center of the circle
 * @param {Number} radius - radius of the circle
 *
 * @return {Array<Array<Number>>} array of `[lat, lng]` coordinate
 * pairs forming the circle
 */
export const circlePolyline = (latlng, radius) => {
  const { lat, lng } = latlng;
  const detail = 8;
  const R = 6371;
  const pi = Math.PI;

  const _lat = (lat * pi) / 180;
  const _lng = (lng * pi) / 180;
  const d = radius / 1000 / R;

  let points = [];
  for (let i = 0; i <= 360; i += detail) {
    const brng = (i * pi) / 180;

    let pLat = Math.asin(
      Math.sin(_lat) * Math.cos(d) +
        Math.cos(_lat) * Math.sin(d) * Math.cos(brng)
    );
    const pLng =
      ((_lng +
        Math.atan2(
          Math.sin(brng) * Math.sin(d) * Math.cos(_lat),
          Math.cos(d) - Math.sin(_lat) * Math.sin(pLat)
        )) *
        180) /
      pi;
    pLat = (pLat * 180) / pi;

    points.push([pLat, pLng]);
  }

  return points;
};

/**
 * Cut some precision from bounds coordinates to tackle subtle map movements
 * when map is moved manually
 *
 * @param {LatLngBounds} sdkBounds - bounds to be changed to fixed precision
 * @param {Number} fixedPrecision - integer to be used on tofixed() change.
 *
 * @return {LatLngBounds} - bounds cut to given fixed precision
 */
export const sdkBoundsToFixedCoordinates = (sdkBounds, fixedPrecision) => {
  const fixed = (n) => Number.parseFloat(n.toFixed(fixedPrecision));
  const ne = new LatLng(fixed(sdkBounds.ne.lat), fixed(sdkBounds.ne.lng));
  const sw = new LatLng(fixed(sdkBounds.sw.lat), fixed(sdkBounds.sw.lng));

  return new LatLngBounds(ne, sw);
};

/**
 * Check if given bounds object have the same coordinates
 *
 * @param {LatLngBounds} sdkBounds1 - bounds #1 to be compared
 * @param {LatLngBounds} sdkBounds2 - bounds #2 to be compared
 *
 * @return {boolean} - true if bounds are the same
 */
export const hasSameSDKBounds = (sdkBounds1, sdkBounds2) => {
  if (
    !(sdkBounds1 instanceof LatLngBounds) ||
    !(sdkBounds2 instanceof LatLngBounds)
  ) {
    return false;
  }
  return (
    sdkBounds1.ne.lat === sdkBounds2.ne.lat &&
    sdkBounds1.ne.lng === sdkBounds2.ne.lng &&
    sdkBounds1.sw.lat === sdkBounds2.sw.lat &&
    sdkBounds1.sw.lng === sdkBounds2.sw.lng
  );
};

/**
 * Return googleMapsAPIKey, mapboxAccessToken, or true depending on which map provider is selected.
 * OpenStreetMap doesn't require an API key but needs custom User-Agent headers for tile requests.
 *
 * @param {Object} mapConfig
 * @returns googleMapsAPIKey, mapboxAccessToken, or true for openStreetMap
 */
export const getMapProviderApiAccess = (mapConfig) => {
  const { mapProvider } = mapConfig;

  if (mapProvider === 'googleMaps') {
    return mapConfig.googleMapsAPIKey;
  } else if (mapProvider === 'openStreetMap') {
    return true;
  } else {
    return mapConfig.mapboxAccessToken;
  }
};

/**
 * Generate a URL to view a location on an external map site
 * based on the configured map provider.
 *
 * @param {Object} params - Parameters for generating the URL
 * @param {LatLng|null} params.geolocation - The geolocation coordinates
 * @param {string|null} params.address - The address string
 * @param {string} params.mapProvider - The map provider ('googleMaps', 'mapbox', 'openStreetMap')
 * @returns {string|null} - URL to view the location on the external map site, or null if no location provided
 */
export const generateExternalMapUrl = ({
  geolocation,
  address,
  mapProvider,
}) => {
  if (!geolocation && address == null) {
    return null;
  }

  const { lat, lng } = geolocation || {};

  switch (mapProvider) {
    case 'googleMaps':
      return geolocation
        ? `https://maps.google.com/?q=${lat},${lng}`
        : `https://maps.google.com/?q=${encodeURIComponent(address)}`;

    case 'openStreetMap':
      return geolocation
        ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`
        : `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;

    case 'mapbox':
    default:
      return geolocation
        ? `https://maps.google.com/?q=${lat},${lng}`
        : `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  }
};

/**
 * Calculate bounding box that encompasses a given radius around a center point
 *
 * @param {LatLng|Object} latlng - center point with lat and lng properties
 * @param {number} radiusInMeters - radius around the center point in meters
 *
 * @return {LatLngBounds} - bounds that encompass the specified radius
 */
export const getBoundsForConstantRadius = (latlng, radiusInMeters) => {
  const { lat, lng } = latlng;

  // Convert latitude to radians for calculation
  const latRad = lat * DEG_TO_RAD;

  // Calculate latitude offset
  const latOffset = radiusInMeters / EARTH_RADIUS / DEG_TO_RAD;

  // Calculate longitude offset (accounts for latitude convergence)
  const lngOffset =
    radiusInMeters / (EARTH_RADIUS * Math.cos(latRad)) / DEG_TO_RAD;

  // Calculate bounding box corners
  const northLat = lat + latOffset;
  const southLat = lat - latOffset;
  const eastLng = lng + lngOffset;
  const westLng = lng - lngOffset;

  // Create northeast and southwest corners
  const ne = new LatLng(northLat, eastLng);
  const sw = new LatLng(southLat, westLng);

  return new LatLngBounds(ne, sw);
};

/**
 * Calculate the distance between two geographic points using the Haversine formula
 *
 * @param {LatLng|Object} point1 - first point with lat and lng properties
 * @param {LatLng|Object} point2 - second point with lat and lng properties
 *
 * @return {number} - distance between the two points in meters
 */
export const calculateDistanceBetweenPoints = (point1, point2) => {
  const { lat: lat1, lng: lng1 } = point1;
  const { lat: lat2, lng: lng2 } = point2;

  const lat1Rad = lat1 * DEG_TO_RAD;
  const lat2Rad = lat2 * DEG_TO_RAD;
  const deltaLatRad = (lat2 - lat1) * DEG_TO_RAD;
  const deltaLngRad = (lng2 - lng1) * DEG_TO_RAD;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLngRad / 2) *
      Math.sin(deltaLngRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
};

/**
 * Filter listings to only include those within a specified radius from a center point
 *
 * @param {Array} listings - array of listing objects with geolocation attributes
 * @param {LatLng|Object} center - center point with lat and lng properties
 * @param {number} radiusInMeters - maximum distance from center in meters
 *
 * @return {Array} - filtered array of listings within the specified radius
 */
export const filterListingsByRadius = (listings, center, radiusInMeters) => {
  if (!center || !center.lat || !center.lng || !Array.isArray(listings)) {
    return listings;
  }

  return listings.filter((listing) => {
    const geolocation = listing?.attributes?.geolocation;
    if (!geolocation || !geolocation.lat || !geolocation.lng) {
      return false;
    }

    const distance = calculateDistanceBetweenPoints(center, geolocation);
    return distance <= radiusInMeters;
  });
};
