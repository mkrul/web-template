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
 * Static (non-interactive) version of OpenStreetMap using Leaflet
 *
 * @component
 * @param {Object} props
 * @param {string?} props.containerClassName add style rules for the root container
 * @param {string?} props.mapClassName add style rules for the map div
 * @param {string?} props.address
 * @param {Object} props.center LatLng (may be obfuscated when fuzzy locations are enabled)
 * @param {number} props.center.lat latitude
 * @param {number} props.center.lng longitude
 * @param {number} props.zoom zoom level
 * @returns {JSX.Element} static (non-interactive) version of OpenStreetMap
 */
class StaticOpenStreetMap extends Component {
  constructor(props) {
    super(props);

    this.mapRef = React.createRef();
  }

  render() {
    const { containerClassName, mapClassName, center, zoom, address } =
      this.props;

    // Convert to Leaflet format [lat, lng]
    const leafletCenter = [center.lat, center.lng];

    return (
      <div className={containerClassName}>
        <div className={mapClassName}>
          <MapContainer
            ref={this.mapRef}
            center={leafletCenter}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            // Disable all interaction handlers to make it static
            zoomControl={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            dragging={false}
            touchZoom={false}
            boxZoom={false}
            keyboard={false}
            attributionControl={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              // User-Agent compliance is handled by setting a proper attribution
              // and ensuring requests include proper referer/user-agent via browser defaults
            />

            <Marker position={leafletCenter} title={address} />
          </MapContainer>
        </div>
      </div>
    );
  }
}

export default StaticOpenStreetMap;
