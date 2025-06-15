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
}));

// Mock CSS import
jest.mock('leaflet/dist/leaflet.css', () => ({}));

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import StaticOpenStreetMap from './StaticOpenStreetMap';

describe('StaticOpenStreetMap', () => {
  const defaultProps = {
    center: { lat: 40.7128, lng: -74.006 },
    zoom: 13,
    address: 'New York, NY',
    containerClassName: 'map-container',
    mapClassName: 'map-div',
  };

  it('renders map container with correct props', () => {
    render(<StaticOpenStreetMap {...defaultProps} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
    expect(mapContainer).toHaveAttribute('data-center', '[40.7128,-74.006]');
    expect(mapContainer).toHaveAttribute('data-zoom', '13');
  });

  it('applies container and map class names', () => {
    const { container } = render(<StaticOpenStreetMap {...defaultProps} />);

    expect(container.querySelector('.map-container')).toBeInTheDocument();
    expect(container.querySelector('.map-div')).toBeInTheDocument();
  });

  it('renders OpenStreetMap tile layer with correct attribution', () => {
    render(<StaticOpenStreetMap {...defaultProps} />);

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

  it('renders marker with correct position and title', () => {
    render(<StaticOpenStreetMap {...defaultProps} />);

    const marker = screen.getByTestId('marker');
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute('data-position', '[40.7128,-74.006]');
    expect(marker).toHaveAttribute('data-title', 'New York, NY');
  });

  it('disables all interaction handlers for static map', () => {
    render(<StaticOpenStreetMap {...defaultProps} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveAttribute('data-zoomcontrol', 'false');
    expect(mapContainer).toHaveAttribute('data-scrollwheelzoom', 'false');
    expect(mapContainer).toHaveAttribute('data-doubleclickzoom', 'false');
    expect(mapContainer).toHaveAttribute('data-dragging', 'false');
    expect(mapContainer).toHaveAttribute('data-touchzoom', 'false');
    expect(mapContainer).toHaveAttribute('data-boxzoom', 'false');
    expect(mapContainer).toHaveAttribute('data-keyboard', 'false');
  });

  it('converts coordinates to Leaflet format correctly', () => {
    const center = { lat: 51.5074, lng: -0.1278 };
    render(<StaticOpenStreetMap {...defaultProps} center={center} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveAttribute('data-center', '[51.5074,-0.1278]');

    const marker = screen.getByTestId('marker');
    expect(marker).toHaveAttribute('data-position', '[51.5074,-0.1278]');
  });

  it('handles missing optional props gracefully', () => {
    const minimalProps = {
      center: { lat: 40.7128, lng: -74.006 },
      zoom: 13,
    };

    render(<StaticOpenStreetMap {...minimalProps} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();

    const marker = screen.getByTestId('marker');
    expect(marker).toHaveAttribute('data-title', '');
  });

  it('uses attribution control by default', () => {
    render(<StaticOpenStreetMap {...defaultProps} />);

    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveAttribute('data-attributioncontrol', 'true');
  });
});
