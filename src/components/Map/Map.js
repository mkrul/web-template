import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { getMapProviderApiAccess } from '../../util/maps';
import * as openStreetMap from './OpenStreetMap';

import css from './Map.module.css';

/**
 * Map component that uses StaticMap or DynamicMap from OpenStreetMap
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

  // Use OpenStreetMap components
  const { StaticMap, DynamicMap, isMapsLibLoaded } = openStreetMap;

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

  const zoomLevel =
    zoom || mapsConfiguration.fuzzy.enabled
      ? mapsConfiguration.fuzzy.defaultZoomLevel
      : 11;

  const isMapProviderAvailable =
    hasApiAccessForMapProvider && isMapsLibLoaded();

  if (!isMapProviderAvailable) {
    return <div className={classes} />;
  }

  // For dynamic maps, pass both center and obfuscatedCenter
  // so the component can handle fuzzy location logic internally
  if (!useStaticMap) {
    return (
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

  // For static maps, use the appropriate center based on fuzzy configuration
  const location = mapsConfiguration.fuzzy.enabled ? obfuscatedCenter : center;
  return (
    <StaticMap
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
