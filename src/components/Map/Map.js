import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { getMapProviderApiAccess } from '../../util/maps';
import * as mapboxMap from './MapboxMap';
import * as googleMapsMap from './GoogleMap';
import * as openStreetMap from './OpenStreetMap';

import css from './Map.module.css';

/**
 * Map component that uses StaticMap or DynamicMap from the configured map provider: Mapbox, Google Maps, or OpenStreetMap
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.mapRootClassName add style rules for the root container
 * @param {string?} props.address
 * @param {Object} props.center LatLng
 * @param {number} props.center.lat latitude
 * @param {number} props.center.lng longitude
 * @param {Object} props.obfuscatedCenter LatLng
 * @param {number} props.obfuscatedCenter.lat latitude
 * @param {number} props.obfuscatedCenter.lng longitude
 * @param {number} props.zoom
 * @param {Object} props.mapsConfig
 * @param {boolean} props.useStaticMap
 * @returns {JSX.Element} Map component
 */
export const Map = (props) => {
  const config = useConfiguration();
  const {
    className,
    rootClassName,
    mapRootClassName,
    address,
    center,
    obfuscatedCenter,
    zoom,
    mapsConfig,
    useStaticMap,
  } = props;
  const mapsConfiguration = mapsConfig || config.maps;
  const hasApiAccessForMapProvider =
    !!getMapProviderApiAccess(mapsConfiguration);

  // Determine which map provider components to use
  const mapProvider = mapsConfiguration.mapProvider;
  let StaticMap, DynamicMap, isMapsLibLoaded;

  if (mapProvider === 'googleMaps') {
    StaticMap = googleMapsMap.StaticMap;
    DynamicMap = googleMapsMap.DynamicMap;
    isMapsLibLoaded = googleMapsMap.isMapsLibLoaded;
  } else if (mapProvider === 'openStreetMap') {
    StaticMap = openStreetMap.StaticMap;
    DynamicMap = openStreetMap.DynamicMap;
    isMapsLibLoaded = openStreetMap.isMapsLibLoaded;
  } else {
    // Default to Mapbox
    StaticMap = mapboxMap.StaticMap;
    DynamicMap = mapboxMap.DynamicMap;
    isMapsLibLoaded = mapboxMap.isMapsLibLoaded;
  }

  const classes = classNames(rootClassName || css.root, className);
  const mapClasses = mapRootClassName || css.mapRoot;

  if (mapsConfiguration.fuzzy.enabled && !obfuscatedCenter) {
    throw new Error(
      'Map: obfuscatedCenter prop is required when config.maps.fuzzy.enabled === true'
    );
  }
  if (!mapsConfiguration.fuzzy.enabled && !center) {
    throw new Error(
      'Map: center prop is required when config.maps.fuzzy.enabled === false'
    );
  }

  const location = mapsConfiguration.fuzzy.enabled ? obfuscatedCenter : center;
  const zoomLevel =
    zoom || mapsConfiguration.fuzzy.enabled
      ? mapsConfiguration.fuzzy.defaultZoomLevel
      : 11;

  const isMapProviderAvailable =
    hasApiAccessForMapProvider && isMapsLibLoaded();

  // For OpenStreetMap dynamic maps, pass both center and obfuscatedCenter
  // so the component can handle fuzzy location logic internally
  if (mapProvider === 'openStreetMap' && !useStaticMap) {
    return !isMapProviderAvailable ? (
      <div className={classes} />
    ) : (
      <DynamicMap
        containerClassName={classes}
        mapClassName={mapClasses}
        center={center}
        obfuscatedCenter={obfuscatedCenter}
        zoom={zoomLevel}
        address={address}
        mapsConfig={mapsConfiguration}
      />
    );
  }

  // For static maps and other providers, use the existing logic
  return !isMapProviderAvailable ? (
    <div className={classes} />
  ) : useStaticMap ? (
    <StaticMap
      center={location}
      zoom={zoomLevel}
      address={address}
      mapsConfig={mapsConfiguration}
    />
  ) : (
    <DynamicMap
      containerClassName={classes}
      mapClassName={mapClasses}
      center={location}
      zoom={zoomLevel}
      address={address}
      mapsConfig={mapsConfiguration}
    />
  );
};

export default Map;
