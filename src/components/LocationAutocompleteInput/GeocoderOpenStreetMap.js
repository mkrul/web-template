import { types as sdkTypes } from '../../util/sdkLoader';
import { userLocation } from '../../util/maps';

const { LatLng: SDKLatLng, LatLngBounds: SDKLatLngBounds } = sdkTypes;

export const CURRENT_LOCATION_ID = 'current-location';

const GENERATED_BOUNDS_DEFAULT_DISTANCE = 500;
const PLACE_TYPE_BOUNDS_DISTANCES = {
  house: 500,
  building: 500,
  residential: 500,
  city: 2000,
  town: 2000,
  village: 2000,
  state: 5000,
  country: 10000,
  default: 500,
};

const APPLICATION_NAME = 'OpenStreetMapIntegration';

let lastRequestTime = 0;
const REQUEST_DELAY = 1000;

let resultCache = new Map();
const CACHE_EXPIRY_TIME = 300000;

const respectRateLimit = () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < REQUEST_DELAY) {
    return new Promise((resolve) => {
      setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest);
    });
  }

  return Promise.resolve();
};

const locationBounds = (latlng, distance) => {
  if (!latlng) {
    return null;
  }

  const latRadius = distance / 111320;
  const lngRadius =
    distance / (111320 * Math.cos((latlng.lat * Math.PI) / 180));

  const north = latlng.lat + latRadius;
  const south = latlng.lat - latRadius;
  const east = latlng.lng + lngRadius;
  const west = latlng.lng - lngRadius;

  return new SDKLatLngBounds(
    new SDKLatLng(north, east),
    new SDKLatLng(south, west)
  );
};

const placeOrigin = (prediction) => {
  if (prediction && prediction.lat && prediction.lon) {
    return new SDKLatLng(
      parseFloat(prediction.lat),
      parseFloat(prediction.lon)
    );
  }
  return null;
};

const placeBounds = (prediction) => {
  if (prediction) {
    if (
      prediction.boundingbox &&
      Array.isArray(prediction.boundingbox) &&
      prediction.boundingbox.length === 4
    ) {
      const [south, north, west, east] = prediction.boundingbox.map((coord) =>
        parseFloat(coord)
      );
      return new SDKLatLngBounds(
        new SDKLatLng(north, east),
        new SDKLatLng(south, west)
      );
    } else {
      const placeType = prediction.type || prediction.class || 'default';
      const distance =
        PLACE_TYPE_BOUNDS_DISTANCES[placeType] ||
        GENERATED_BOUNDS_DEFAULT_DISTANCE;
      return locationBounds(placeOrigin(prediction), distance);
    }
  }
  return null;
};

export const GeocoderAttribution = () => null;

class GeocoderOpenStreetMap {
  getClient() {
    return {
      search: this.searchNominatim.bind(this),
    };
  }

  async searchNominatim(query, countryLimit, locale) {
    const cacheKey = `${query}-${countryLimit || ''}-${locale || ''}`;
    const cached = resultCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_TIME) {
      return cached.data;
    }

    await respectRateLimit();
    lastRequestTime = Date.now();

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: '5',
      extratags: '1',
      namedetails: '1',
    });

    if (countryLimit && Array.isArray(countryLimit)) {
      params.append('countrycodes', countryLimit.join(','));
    }

    if (locale) {
      params.append('accept-language', locale);
    }

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': APPLICATION_NAME,
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API request failed: ${response.status}`);
      }

      const data = await response.json();

      resultCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      if (resultCache.size > 100) {
        const oldestKey = resultCache.keys().next().value;
        resultCache.delete(oldestKey);
      }

      return data;
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
      return [];
    }
  }

  async getPlacePredictions(search, countryLimit, locale) {
    try {
      const client = this.getClient();
      const predictions = await client.search(search, countryLimit, locale);

      return {
        search,
        predictions,
      };
    } catch (error) {
      console.error('Error getting place predictions:', error);
      return {
        search,
        predictions: [],
      };
    }
  }

  getPredictionId(prediction) {
    return prediction.place_id ? prediction.place_id.toString() : prediction.id;
  }

  getPredictionAddress(prediction) {
    if (prediction.predictionPlace) {
      return prediction.predictionPlace.address;
    }

    // Format address from OpenStreetMap Nominatim data
    // Exclude county to make it more like a standard delivery address
    return this.formatNominatimAddress(prediction);
  }

  formatNominatimAddress(prediction) {
    // Use display_name as fallback if address details are not available
    if (!prediction.address) {
      return prediction.display_name;
    }

    const addr = prediction.address;
    const components = [];

    // House number and street
    if (addr.house_number && addr.road) {
      components.push(`${addr.house_number} ${addr.road}`);
    } else if (addr.road) {
      components.push(addr.road);
    } else if (addr.house_number) {
      components.push(addr.house_number);
    }

    // City/town/village
    if (addr.city) {
      components.push(addr.city);
    } else if (addr.town) {
      components.push(addr.town);
    } else if (addr.village) {
      components.push(addr.village);
    } else if (addr.municipality) {
      components.push(addr.municipality);
    }

    // State/province (skip county deliberately)
    if (addr.state) {
      components.push(addr.state);
    } else if (addr.province) {
      components.push(addr.province);
    }

    // Postal code
    if (addr.postcode) {
      components.push(addr.postcode);
    }

    // Country - exclude United States as it's not typically shown in domestic delivery addresses
    if (addr.country && addr.country !== 'United States') {
      components.push(addr.country);
    }

    // Join components with commas, or fallback to display_name
    return components.length > 0
      ? components.join(', ')
      : prediction.display_name;
  }

  getPlaceDetails(prediction, currentLocationBoundsDistance) {
    if (this.getPredictionId(prediction) === CURRENT_LOCATION_ID) {
      return userLocation().then((latlng) => {
        return {
          address: '',
          origin: latlng,
          bounds: locationBounds(latlng, currentLocationBoundsDistance),
        };
      });
    }

    if (prediction.predictionPlace) {
      return Promise.resolve(prediction.predictionPlace);
    }

    return Promise.resolve({
      address: this.getPredictionAddress(prediction),
      origin: placeOrigin(prediction),
      bounds: placeBounds(prediction),
    });
  }
}

export default GeocoderOpenStreetMap;
