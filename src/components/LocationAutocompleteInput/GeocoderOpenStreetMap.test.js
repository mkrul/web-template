import { types as sdkTypes } from '../../util/sdkLoader';
import * as GeocoderOpenStreetMap from './GeocoderOpenStreetMap';

const { LatLng: SDKLatLng, LatLngBounds: SDKLatLngBounds } = sdkTypes;

// Mock fetch
global.fetch = jest.fn();

// Mock userLocation
jest.mock('../../util/maps', () => ({
  userLocation: jest.fn(),
}));

describe('GeocoderOpenStreetMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    GeocoderOpenStreetMap.clearCache();
  });

  afterEach(() => {
    console.error.mockRestore?.();
  });

  describe('CURRENT_LOCATION_ID', () => {
    it('exports correct current location ID', () => {
      expect(GeocoderOpenStreetMap.CURRENT_LOCATION_ID).toBe(
        'current-location'
      );
    });
  });

  describe('Rate limiting', () => {
    it('respects rate limiting between requests', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([]),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const startTime = Date.now();

      // Make first request
      await GeocoderOpenStreetMap.searchPlaces('New York');

      // Make second request immediately
      await GeocoderOpenStreetMap.searchPlaces('Boston');

      const endTime = Date.now();
      const timeDiff = endTime - startTime;

      // Should have waited at least 1000ms between requests
      expect(timeDiff).toBeGreaterThanOrEqual(990); // Allow for small timing variations
    });
  });

  describe('Cache functionality', () => {
    it('uses cached results for identical queries', async () => {
      const mockResponse = {
        ok: true,
        json: () =>
          Promise.resolve([
            {
              display_name: 'New York City, NY, USA',
              lat: '40.7128',
              lon: '-74.0060',
              type: 'city',
              boundingbox: ['40.4774', '40.9176', '-74.2591', '-73.7004'],
            },
          ]),
      };
      global.fetch.mockResolvedValue(mockResponse);

      // First request
      const firstResult = await GeocoderOpenStreetMap.searchPlaces('New York');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second identical request should use cache
      const secondResult = await GeocoderOpenStreetMap.searchPlaces('New York');
      expect(global.fetch).toHaveBeenCalledTimes(1); // No additional fetch call

      expect(firstResult).toEqual(secondResult);
    });

    it('makes new request for different queries', async () => {
      const mockResponse1 = {
        ok: true,
        json: () =>
          Promise.resolve([
            {
              display_name: 'New York City, NY, USA',
              lat: '40.7128',
              lon: '-74.0060',
              type: 'city',
            },
          ]),
      };
      const mockResponse2 = {
        ok: true,
        json: () =>
          Promise.resolve([
            {
              display_name: 'Boston, MA, USA',
              lat: '42.3601',
              lon: '-71.0589',
              type: 'city',
            },
          ]),
      };

      global.fetch
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      await GeocoderOpenStreetMap.searchPlaces('New York');
      await GeocoderOpenStreetMap.searchPlaces('Boston');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('API request formatting', () => {
    it('formats search request with correct parameters', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([]),
      };
      global.fetch.mockResolvedValue(mockResponse);

      await GeocoderOpenStreetMap.searchPlaces('New York');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://nominatim.openstreetmap.org/search'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': expect.stringContaining('OpenStreetMapIntegration'),
          }),
        })
      );

      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toContain('q=New+York');
      expect(calledUrl).toContain('format=json');
      expect(calledUrl).toContain('addressdetails=1');
      expect(calledUrl).toContain('limit=5');
    });
  });

  describe('Response parsing', () => {
    it('parses OpenStreetMap response correctly', async () => {
      const mockOSMResponse = [
        {
          display_name: 'New York City, New York, United States',
          lat: '40.7128',
          lon: '-74.0060',
          type: 'city',
          boundingbox: ['40.4774', '40.9176', '-74.2591', '-73.7004'],
          address: {
            city: 'New York City',
            state: 'New York',
            country: 'United States',
          },
        },
      ];

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockOSMResponse),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await GeocoderOpenStreetMap.searchPlaces('New York');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          predictionText: 'New York City, New York, United States',
          origin: expect.any(SDKLatLng),
          bounds: expect.any(SDKLatLngBounds),
        })
      );
    });

    it('handles empty response gracefully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve([]),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result =
        await GeocoderOpenStreetMap.searchPlaces('NonexistentPlace');
      expect(result).toEqual([]);
    });

    it('handles API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await GeocoderOpenStreetMap.searchPlaces('New York');
      expect(result).toEqual([]);
    });
  });

  describe('Coordinate conversion', () => {
    it('converts string coordinates to SDK LatLng objects', async () => {
      const mockOSMResponse = [
        {
          display_name: 'Test Location',
          lat: '40.7128',
          lon: '-74.0060',
          type: 'city',
          boundingbox: ['40.4774', '40.9176', '-74.2591', '-73.7004'],
        },
      ];

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockOSMResponse),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await GeocoderOpenStreetMap.searchPlaces('Test');

      expect(result[0].origin).toBeInstanceOf(SDKLatLng);
      expect(result[0].origin.lat).toBe(40.7128);
      expect(result[0].origin.lng).toBe(-74.006);
    });

    it('creates bounds from bounding box', async () => {
      const mockOSMResponse = [
        {
          display_name: 'Test Location',
          lat: '40.7128',
          lon: '-74.0060',
          type: 'city',
          boundingbox: ['40.4774', '40.9176', '-74.2591', '-73.7004'],
        },
      ];

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(mockOSMResponse),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await GeocoderOpenStreetMap.searchPlaces('Test');

      expect(result[0].bounds).toBeInstanceOf(SDKLatLngBounds);
      expect(result[0].bounds.ne.lat).toBe(40.9176);
      expect(result[0].bounds.ne.lng).toBe(-73.7004);
      expect(result[0].bounds.sw.lat).toBe(40.4774);
      expect(result[0].bounds.sw.lng).toBe(-74.2591);
    });
  });

  describe('Place type handling', () => {
    it('generates appropriate bounds based on place type', async () => {
      const cityResponse = [
        {
          display_name: 'Test City',
          lat: '40.7128',
          lon: '-74.0060',
          type: 'city',
          // No boundingbox to trigger generated bounds
        },
      ];

      const mockResponse = {
        ok: true,
        json: () => Promise.resolve(cityResponse),
      };
      global.fetch.mockResolvedValue(mockResponse);

      const result = await GeocoderOpenStreetMap.searchPlaces('Test City');

      expect(result[0].bounds).toBeInstanceOf(SDKLatLngBounds);
      // Should generate bounds based on city type (2000m distance)
      const boundsSize = Math.abs(
        result[0].bounds.ne.lat - result[0].bounds.sw.lat
      );
      expect(boundsSize).toBeGreaterThan(0.01); // Should be reasonable size for city
    });
  });
});
