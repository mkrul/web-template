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

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import DynamicOpenStreetMap from './DynamicOpenStreetMap';

describe('DynamicOpenStreetMap', () => {
  const defaultProps = {
    center: { lat: 40.7128, lng: -74.006 },
    zoom: 13,
    address: 'New York, NY',
    containerClassName: 'map-container',
    mapClassName: 'map-div',
    mapsConfig: {
      fuzzy: {
        enabled: false,
      },
    },
  };

  it('renders map container with correct props', () => {
    render(<DynamicOpenStreetMap {...defaultProps} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer).toHaveAttribute('data-center', '[40.7128,-74.006]');
    expect(mapContainer).toHaveAttribute('data-zoom', '13');
  });

  it('enables all interaction handlers for dynamic map', () => {
    render(<DynamicOpenStreetMap {...defaultProps} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveAttribute('data-zoomcontrol', 'true');
    expect(mapContainer).toHaveAttribute('data-scrollwheelzoom', 'true');
    expect(mapContainer).toHaveAttribute('data-doubleclickzoom', 'true');
    expect(mapContainer).toHaveAttribute('data-dragging', 'true');
    expect(mapContainer).toHaveAttribute('data-attributioncontrol', 'true');
  });

  it('renders OpenStreetMap tile layer with correct attribution', () => {
    render(<DynamicOpenStreetMap {...defaultProps} />);

    const tileLayer = screen.getByTestId('tile-layer');
    expect(tileLayer).toBeInTheDocument();
    expect(tileLayer).toHaveAttribute(
      'data-url',
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    );
    expect(tileLayer).toHaveAttribute(
      'data-attribution',
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    );
  });

  it('renders marker when fuzzy is disabled', () => {
    render(<DynamicOpenStreetMap {...defaultProps} />);

    const marker = screen.getByTestId('marker');
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute('data-position', '[40.7128,-74.006]');
    expect(marker).toHaveAttribute('data-title', 'New York, NY');

    expect(screen.queryByTestId('circle')).not.toBeInTheDocument();
  });

  it('renders circle when fuzzy is enabled', () => {
    const fuzzyProps = {
      ...defaultProps,
      obfuscatedCenter: { lat: 40.71, lng: -74.008 },
      mapsConfig: {
        fuzzy: {
          enabled: true,
          distance: 500,
          circleColor: '#FF0000',
        },
      },
    };

    render(<DynamicOpenStreetMap {...fuzzyProps} />);

    const circle = screen.getByTestId('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('data-center', '[40.71,-74.008]');
    expect(circle).toHaveAttribute('data-radius', '500');

    const pathOptions = JSON.parse(circle.getAttribute('data-pathoptions'));
    expect(pathOptions.fillColor).toBe('#FF0000');
    expect(pathOptions.color).toBe('#FF0000');
    expect(pathOptions.fillOpacity).toBe(0.2);
    expect(pathOptions.weight).toBe(1);
    expect(pathOptions.opacity).toBe(0.5);

    expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
  });

  it('uses obfuscated center when fuzzy is enabled', () => {
    const fuzzyProps = {
      ...defaultProps,
      center: { lat: 40.7128, lng: -74.006 },
      obfuscatedCenter: { lat: 40.71, lng: -74.008 },
      mapsConfig: {
        fuzzy: {
          enabled: true,
          distance: 500,
          circleColor: '#FF0000',
        },
      },
    };

    render(<DynamicOpenStreetMap {...fuzzyProps} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveAttribute('data-center', '[40.71,-74.008]');
  });

  it('uses regular center when fuzzy is disabled', () => {
    const props = {
      ...defaultProps,
      center: { lat: 40.7128, lng: -74.006 },
      obfuscatedCenter: { lat: 40.71, lng: -74.008 },
      mapsConfig: {
        fuzzy: {
          enabled: false,
        },
      },
    };

    render(<DynamicOpenStreetMap {...props} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveAttribute('data-center', '[40.7128,-74.006]');
  });

  it('handles missing mapsConfig gracefully', () => {
    const propsWithoutMapsConfig = {
      center: { lat: 40.7128, lng: -74.006 },
      zoom: 13,
    };

    render(<DynamicOpenStreetMap {...propsWithoutMapsConfig} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();

    const marker = screen.getByTestId('marker');
    expect(marker).toBeInTheDocument();
    expect(screen.queryByTestId('circle')).not.toBeInTheDocument();
  });

  it('handles missing fuzzy config gracefully', () => {
    const propsWithoutFuzzy = {
      ...defaultProps,
      mapsConfig: {},
    };

    render(<DynamicOpenStreetMap {...propsWithoutFuzzy} />);

    const marker = screen.getByTestId('marker');
    expect(marker).toBeInTheDocument();
    expect(screen.queryByTestId('circle')).not.toBeInTheDocument();
  });

  it('applies container and map class names', () => {
    const { container } = render(<DynamicOpenStreetMap {...defaultProps} />);

    expect(container.querySelector('.map-container')).toBeInTheDocument();
    expect(container.querySelector('.map-div')).toBeInTheDocument();
  });

  it('converts coordinates to Leaflet format correctly', () => {
    const center = { lat: 51.5074, lng: -0.1278 };
    render(<DynamicOpenStreetMap {...defaultProps} center={center} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveAttribute('data-center', '[51.5074,-0.1278]');

    const marker = screen.getByTestId('marker');
    expect(marker).toHaveAttribute('data-position', '[51.5074,-0.1278]');
  });
});
