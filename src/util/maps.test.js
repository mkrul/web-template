import { getMapProviderApiAccess, generateExternalMapUrl } from './maps';

describe('maps utilities for OpenStreetMap integration', () => {
  describe('getMapProviderApiAccess', () => {
    it('returns true for openStreetMap provider', () => {
      const mapConfig = {
        mapProvider: 'openStreetMap',
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

    describe('mapbox provider', () => {
      it('falls back to OpenStreetMap URL format', () => {
        const params = {
          geolocation: { lat: 40.7128, lng: -74.006 },
          mapProvider: 'mapbox',
        };

        const result = generateExternalMapUrl(params);
        expect(result).toBe(
          'https://www.openstreetmap.org/?mlat=40.7128&mlon=-74.006&zoom=15'
        );
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
