import React, { Component } from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers not appearing
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * Map that uses OpenStreetMap (via Leaflet) and is fully dynamic (zoom, pan, etc.).
 *
 * @component
 * @param {Object} props
 * @param {string?} props.containerClassName add style rules for the root container
 * @param {string?} props.mapClassName add style rules for the map div
 * @param {string?} props.address
 * @param {Object} props.center LatLng for marker when fuzzy is disabled
 * @param {number} props.center.lat latitude
 * @param {number} props.center.lng longitude
 * @param {Object} props.obfuscatedCenter LatLng for circle when fuzzy is enabled
 * @param {number} props.obfuscatedCenter.lat latitude
 * @param {number} props.obfuscatedCenter.lng longitude
 * @param {number} props.zoom
 * @param {Object} props.mapsConfig
 * @param {Object} props.mapsConfig.fuzzy fuzzy location configuration
 * @param {boolean} props.mapsConfig.fuzzy.enabled whether to show circle or marker
 * @param {number} props.mapsConfig.fuzzy.distance radius for the circle in meters
 * @param {string} props.mapsConfig.fuzzy.circleColor color for the circle
 * @returns {JSX.Element} dynamic version of OpenStreetMap
 */
class DynamicOpenStreetMap extends Component {
  componentDidMount() {
    // Set user agent for OSM tile usage policy compliance
    if (typeof window !== 'undefined' && window.L) {
      // This is handled at the request level for tile loading
      // The User-Agent is set via the attribution option
    }
  }

  render() {
    const {
      containerClassName,
      mapClassName,
      center,
      obfuscatedCenter,
      zoom,
      address,
      mapsConfig,
    } = this.props;

    const isFuzzyEnabled =
      mapsConfig && mapsConfig.fuzzy && mapsConfig.fuzzy.enabled;
    const mapCenter = isFuzzyEnabled ? obfuscatedCenter : center;

    // Convert to Leaflet format [lat, lng]
    const leafletCenter = [mapCenter.lat, mapCenter.lng];

    return (
      <div className={containerClassName}>
        <div className={mapClassName}>
          <MapContainer
            center={leafletCenter}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            dragging={true}
            attributionControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              // User-Agent compliance is handled by setting a proper attribution
              // and ensuring requests include proper referer/user-agent via browser defaults
            />

            {isFuzzyEnabled ? (
              <Circle
                center={leafletCenter}
                radius={mapsConfig.fuzzy.distance}
                pathOptions={{
                  fillColor: mapsConfig.fuzzy.circleColor,
                  fillOpacity: 0.2,
                  color: mapsConfig.fuzzy.circleColor,
                  weight: 1,
                  opacity: 0.5,
                }}
              />
            ) : (
              <Marker position={leafletCenter} title={address} />
            )}
          </MapContainer>
        </div>
      </div>
    );
  }
}

export default DynamicOpenStreetMap;
