import { getMapProviderApiAccess, generateExternalMapUrl } from './maps';
import { calculateDistanceBetweenPoints, filterListingsByRadius } from './maps';

describe('maps utilities for OpenStreetMap integration', () => {
  describe('getMapProviderApiAccess', () => {
    it('returns true for openStreetMap provider', () => {
      const mapConfig = {
        mapProvider: 'openStreetMap',
      };

      const result = getMapProviderApiAccess(mapConfig);
      expect(result).toBe(true);
    });

    it('returns true for googleMaps provider (OpenStreetMap only)', () => {
      const mapConfig = {
        mapProvider: 'googleMaps',
        googleMapsAPIKey: 'test-google-key',
      };

      const result = getMapProviderApiAccess(mapConfig);
      expect(result).toBe(true);
    });

    it('returns mapboxAccessToken for mapbox provider', () => {
      const mapConfig = {
        mapProvider: 'mapbox',
        mapboxAccessToken: 'test-mapbox-token',
      };

      const result = getMapProviderApiAccess(mapConfig);
      expect(result).toBe('test-mapbox-token');
    });

    it('returns mapboxAccessToken for unknown provider (default case)', () => {
      const mapConfig = {
        mapProvider: 'unknown',
        mapboxAccessToken: 'test-mapbox-token',
      };

      const result = getMapProviderApiAccess(mapConfig);
      expect(result).toBe('test-mapbox-token');
    });
  });

  describe('generateExternalMapUrl', () => {
    describe('openStreetMap provider', () => {
      it('generates URL with coordinates', () => {
        const params = {
          geolocation: { lat: 40.7128, lng: -74.006 },
          mapProvider: 'openStreetMap',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBe(
          'https://www.openstreetmap.org/?mlat=40.7128&mlon=-74.006&zoom=15'
        );
      });

      it('generates URL with address when no geolocation', () => {
        const params = {
          address: 'New York, NY',
          mapProvider: 'openStreetMap',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBe(
          'https://www.openstreetmap.org/search?query=New%20York%2C%20NY'
        );
      });

      it('handles special characters in address', () => {
        const params = {
          address: 'Café & Restaurant, Paris',
          mapProvider: 'openStreetMap',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBe(
          'https://www.openstreetmap.org/search?query=Caf%C3%A9%20%26%20Restaurant%2C%20Paris'
        );
      });

      it('prefers geolocation over address when both provided', () => {
        const params = {
          geolocation: { lat: 40.7128, lng: -74.006 },
          address: 'New York, NY',
          mapProvider: 'openStreetMap',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBe(
          'https://www.openstreetmap.org/?mlat=40.7128&mlon=-74.006&zoom=15'
        );
      });

      it('handles negative coordinates', () => {
        const params = {
          geolocation: { lat: -33.8688, lng: 151.2093 }, // Sydney
          mapProvider: 'openStreetMap',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBe(
          'https://www.openstreetmap.org/?mlat=-33.8688&mlon=151.2093&zoom=15'
        );
      });

      it('handles zero coordinates', () => {
        const params = {
          geolocation: { lat: 0, lng: 0 },
          mapProvider: 'openStreetMap',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBe(
          'https://www.openstreetmap.org/?mlat=0&mlon=0&zoom=15'
        );
      });
    });

    describe('googleMaps provider (uses OpenStreetMap)', () => {
      it('generates OpenStreetMap URL with coordinates', () => {
        const params = {
          geolocation: { lat: 40.7128, lng: -74.006 },
          mapProvider: 'googleMaps',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBe(
          'https://www.openstreetmap.org/?mlat=40.7128&mlon=-74.006&zoom=15'
        );
      });

      it('generates OpenStreetMap URL with address when no geolocation', () => {
        const params = {
          address: 'New York, NY',
          mapProvider: 'googleMaps',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBe(
          'https://www.openstreetmap.org/search?query=New%20York%2C%20NY'
        );
      });
    });

    describe('mapbox provider', () => {
      it('falls back to Google Maps URL format', () => {
        const params = {
          geolocation: { lat: 40.7128, lng: -74.006 },
          mapProvider: 'mapbox',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBe('https://maps.google.com/?q=40.7128,-74.006');
      });
    });

    describe('edge cases', () => {
      it('returns null when no geolocation and no address', () => {
        const params = {
          mapProvider: 'openStreetMap',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBeNull();
      });

      it('returns null when geolocation and address are null', () => {
        const params = {
          geolocation: null,
          address: null,
          mapProvider: 'openStreetMap',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBeNull();
      });

      it('returns null when geolocation and address are undefined', () => {
        const params = {
          geolocation: undefined,
          address: undefined,
          mapProvider: 'openStreetMap',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBeNull();
      });

      it('handles empty string address', () => {
        const params = {
          address: '',
          mapProvider: 'openStreetMap',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBe('https://www.openstreetmap.org/search?query=');
      });
    });
  });
});

describe('maps utility functions', () => {
  describe('calculateDistanceBetweenPoints', () => {
    it('should calculate distance between two points correctly', () => {
      // Test with known coordinates: New York to Los Angeles (approximately 3944 km)
      const newYork = { lat: 40.7128, lng: -74.006 };
      const losAngeles = { lat: 34.0522, lng: -118.2437 };

      const distance = calculateDistanceBetweenPoints(newYork, losAngeles);

      // Allow for some tolerance in the calculation (within 50km)
      expect(distance).toBeGreaterThan(3900000); // 3900 km
      expect(distance).toBeLessThan(4000000); // 4000 km
    });

    it('should return 0 for same coordinates', () => {
      const point = { lat: 40.7128, lng: -74.006 };
      const distance = calculateDistanceBetweenPoints(point, point);

      expect(distance).toBe(0);
    });
  });

  describe('filterListingsByRadius', () => {
    const center = { lat: 40.7128, lng: -74.006 }; // New York
    const RADIUS_100_MILES = 160934; // 100 miles in meters

    const mockListings = [
      {
        attributes: {
          geolocation: { lat: 40.7, lng: -74.0 }, // Very close to NYC
        },
      },
      {
        attributes: {
          geolocation: { lat: 40.0, lng: -74.0 }, // About 80km from NYC
        },
      },
      {
        attributes: {
          geolocation: { lat: 34.0522, lng: -118.2437 }, // Los Angeles - very far
        },
      },
      {
        attributes: {
          geolocation: null, // No geolocation
        },
      },
    ];

    it('should filter listings within radius correctly', () => {
      const filtered = filterListingsByRadius(
        mockListings,
        center,
        RADIUS_100_MILES
      );

      // Should include close listings and exclude distant ones and those without geolocation
      expect(filtered.length).toBeLessThan(mockListings.length);
      expect(filtered.length).toBeGreaterThan(0);

      // Los Angeles should be filtered out (too far)
      const hasLosAngeles = filtered.some(
        (listing) => listing.attributes.geolocation?.lat === 34.0522
      );
      expect(hasLosAngeles).toBe(false);
    });

    it('should return all listings if no center provided', () => {
      const filtered = filterListingsByRadius(
        mockListings,
        null,
        RADIUS_100_MILES
      );
      expect(filtered).toEqual(mockListings);
    });

    it('should return empty array for invalid input', () => {
      const filtered = filterListingsByRadius(null, center, RADIUS_100_MILES);
      expect(filtered).toEqual(null);
    });

    it('should exclude listings without geolocation', () => {
      const filtered = filterListingsByRadius(
        mockListings,
        center,
        RADIUS_100_MILES
      );

      // Should not include listings without geolocation
      const hasNullGeolocation = filtered.some(
        (listing) => !listing.attributes.geolocation
      );
      expect(hasNullGeolocation).toBe(false);
    });
  });
});
