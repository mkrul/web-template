// Mock Leaflet
jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      prototype: {
        _getIconUrl: jest.fn(),
      },
      mergeOptions: jest.fn(),
    },
  },
}));

// Mock react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom, style, ...leafletProps }) => (
    <div
      data-testid="map-container"
      data-center={JSON.stringify(center)}
      data-zoom={zoom}
      style={style}
      {...Object.fromEntries(
        Object.entries(leafletProps).map(([key, value]) => [
          `data-${key.toLowerCase()}`,
          typeof value === 'boolean' ? value.toString() : value,
        ])
      )}
    >
      {children}
    </div>
  ),
  TileLayer: ({ url, attribution, ...props }) => (
    <div
      data-testid="tile-layer"
      data-url={url}
      data-attribution={attribution}
      {...props}
    />
  ),
  Marker: ({ position, title, ...props }) => (
    <div
      data-testid="marker"
      data-position={JSON.stringify(position)}
      data-title={title || ''}
      {...props}
    />
  ),
  Circle: ({ center, radius, pathOptions, ...props }) => (
    <div
      data-testid="circle"
      data-center={JSON.stringify(center)}
      data-radius={radius}
      data-pathoptions={JSON.stringify(pathOptions)}
      {...props}
    />
  ),
}));

// Mock CSS import
jest.mock('leaflet/dist/leaflet.css', () => ({}));

import { types as sdkTypes } from '../../../util/sdkLoader';
import {
  fitMapToBounds,
  leafletLatLngToSDKLatLng,
  leafletBoundsToSDKBounds,
  getMapBounds,
  getMapCenter,
  isMapsLibLoaded,
} from './SearchMapWithOpenStreetMap';

const { LatLng: SDKLatLng, LatLngBounds: SDKLatLngBounds } = sdkTypes;

// Mock Leaflet
const mockLeafletLatLng = (lat, lng) => ({
  lat,
  lng,
});

const mockLeafletBounds = (sw, ne) => ({
  getSouthWest: () => sw,
  getNorthEast: () => ne,
});

const mockMap = {
  fitBounds: jest.fn(),
  getBounds: jest.fn(),
  getCenter: jest.fn(),
};

describe('SearchMapWithOpenStreetMap utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.L for tests
    global.window = {
      L: {
        map: jest.fn(),
        tileLayer: jest.fn(),
      },
    };
  });

  afterEach(() => {
    delete global.window;
  });

  describe('isMapsLibLoaded', () => {
    it('returns true when Leaflet is loaded', () => {
      global.window.L = { map: jest.fn() };
      expect(isMapsLibLoaded()).toBe(true);
    });

    it('returns false when window is not defined', () => {
      delete global.window;
      expect(isMapsLibLoaded()).toBe(false);
    });

    it('returns false when Leaflet is not loaded', () => {
      global.window.L = undefined;
      expect(isMapsLibLoaded()).toBe(false);
    });
  });

  describe('leafletLatLngToSDKLatLng', () => {
    it('converts normal coordinates correctly', () => {
      const leafletLatLng = mockLeafletLatLng(40.7128, -74.006);
      const result = leafletLatLngToSDKLatLng(leafletLatLng);

      expect(result).toBeInstanceOf(SDKLatLng);
      expect(result.lat).toBe(40.7128);
      expect(result.lng).toBe(-74.006);
    });

    it('handles longitude > 180 (antimeridian crossing)', () => {
      const leafletLatLng = mockLeafletLatLng(40.7128, 200);
      const result = leafletLatLngToSDKLatLng(leafletLatLng);

      expect(result.lat).toBe(40.7128);
      expect(result.lng).toBe(-160); // 200 - 360 = -160
    });

    it('handles longitude < -180 (antimeridian crossing)', () => {
      const leafletLatLng = mockLeafletLatLng(40.7128, -200);
      const result = leafletLatLngToSDKLatLng(leafletLatLng);

      expect(result.lat).toBe(40.7128);
      expect(result.lng).toBe(160); // -200 + 360 = 160
    });

    it('leaves normal longitude values unchanged', () => {
      const leafletLatLng = mockLeafletLatLng(40.7128, 179);
      const result = leafletLatLngToSDKLatLng(leafletLatLng);

      expect(result.lng).toBe(179);
    });
  });

  describe('leafletBoundsToSDKBounds', () => {
    it('converts normal bounds correctly', () => {
      const sw = mockLeafletLatLng(40.4774, -74.2591);
      const ne = mockLeafletLatLng(40.9176, -73.7004);
      const leafletBounds = mockLeafletBounds(sw, ne);

      const result = leafletBoundsToSDKBounds(leafletBounds);

      expect(result).toBeInstanceOf(SDKLatLngBounds);
      expect(result.ne.lat).toBe(40.9176);
      expect(result.ne.lng).toBe(-73.7004);
      expect(result.sw.lat).toBe(40.4774);
      expect(result.sw.lng).toBe(-74.2591);
    });

    it('returns null for null bounds', () => {
      const result = leafletBoundsToSDKBounds(null);
      expect(result).toBeNull();
    });

    it('returns null for undefined bounds', () => {
      const result = leafletBoundsToSDKBounds(undefined);
      expect(result).toBeNull();
    });
  });

  describe('fitMapToBounds', () => {
    it('calls map.fitBounds with correct parameters', () => {
      const bounds = new SDKLatLngBounds(
        new SDKLatLng(40.9176, -73.7004), // ne
        new SDKLatLng(40.4774, -74.2591) // sw
      );

      fitMapToBounds(mockMap, bounds, { padding: 20 });

      expect(mockMap.fitBounds).toHaveBeenCalledWith(
        [
          [40.4774, -74.2591], // sw
          [40.9176, -73.7004], // ne
        ],
        {
          padding: [20, 20],
          animate: false,
        }
      );
    });

    it('handles null bounds gracefully', () => {
      fitMapToBounds(mockMap, null, {});
      expect(mockMap.fitBounds).not.toHaveBeenCalled();
    });

    it('handles null map gracefully', () => {
      const bounds = new SDKLatLngBounds(
        new SDKLatLng(40.9176, -73.7004),
        new SDKLatLng(40.4774, -74.2591)
      );

      // Should not throw
      expect(() => fitMapToBounds(null, bounds, {})).not.toThrow();
    });

    it('uses default padding when not provided', () => {
      const bounds = new SDKLatLngBounds(
        new SDKLatLng(40.9176, -73.7004),
        new SDKLatLng(40.4774, -74.2591)
      );

      fitMapToBounds(mockMap, bounds, {});

      expect(mockMap.fitBounds).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          animate: false,
        })
      );
    });

    it('handles antimeridian crossing in bounds', () => {
      const bounds = new SDKLatLngBounds(
        new SDKLatLng(40.9176, -170), // ne
        new SDKLatLng(40.4774, 170) // sw (crosses antimeridian)
      );

      fitMapToBounds(mockMap, bounds, {});

      expect(mockMap.fitBounds).toHaveBeenCalledWith(
        [
          [40.4774, -190], // sw longitude adjusted
          [40.9176, -170], // ne
        ],
        expect.any(Object)
      );
    });
  });

  describe('getMapBounds', () => {
    it('converts map bounds to SDK bounds', () => {
      const sw = mockLeafletLatLng(40.4774, -74.2591);
      const ne = mockLeafletLatLng(40.9176, -73.7004);
      const leafletBounds = mockLeafletBounds(sw, ne);

      mockMap.getBounds.mockReturnValue(leafletBounds);

      const result = getMapBounds(mockMap);

      expect(result).toBeInstanceOf(SDKLatLngBounds);
      expect(result.ne.lat).toBe(40.9176);
      expect(result.sw.lat).toBe(40.4774);
    });
  });

  describe('getMapCenter', () => {
    it('converts map center to SDK LatLng', () => {
      const center = mockLeafletLatLng(40.7128, -74.006);
      mockMap.getCenter.mockReturnValue(center);

      const result = getMapCenter(mockMap);

      expect(result).toBeInstanceOf(SDKLatLng);
      expect(result.lat).toBe(40.7128);
      expect(result.lng).toBe(-74.006);
    });

    it('handles antimeridian crossing in center coordinates', () => {
      const center = mockLeafletLatLng(40.7128, 200);
      mockMap.getCenter.mockReturnValue(center);

      const result = getMapCenter(mockMap);

      expect(result.lng).toBe(-160); // Normalized longitude
    });
  });
});
