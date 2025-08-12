import React, { Component } from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { userLocation } from '../../util/maps';
import { request as apiRequest } from '../../util/api';
import { Heading } from '../../components';

import css from './ListingPage.module.css';

/**
 * The SectionMapMaybe component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {propTypes.latlng} [props.geolocation] - The geolocation
 * @param {propTypes.uuid} props.listingId - The listing id
 * @returns {JSX.Element} section map maybe component
 */
class SectionMapMaybe extends Component {
  constructor(props) {
    super(props);
    this.state = { distanceMiles: null };
  }

  componentDidMount() {
    const { geolocation } = this.props;
    if (!geolocation) return;

    const listingLat = geolocation.lat;
    const listingLng = geolocation.lng;

    const computeDistanceMiles = (lat1, lng1, lat2, lng2) => {
      const toRad = (d) => (d * Math.PI) / 180;
      const R = 6371000;
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const meters = R * c;
      return meters / 1609.344;
    };

    const setDistanceFrom = (lat, lng) => {
      const miles = computeDistanceMiles(lat, lng, listingLat, listingLng);
      const roundedOneDecimal = Math.round(miles * 10) / 10;
      this.setState({ distanceMiles: roundedOneDecimal });
    };

    userLocation()
      .then((loc) => setDistanceFrom(loc.lat, loc.lng))
      .catch(async () => {
        try {
          const res = await apiRequest('/api/geo/ip', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          const { lat, lng } = res || {};
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            setDistanceFrom(lat, lng);
          }
        } catch (e) {}
      });
  }

  render() {
    const { className, rootClassName, geolocation } = this.props;
    if (!geolocation) return null;

    const classes = classNames(rootClassName || css.sectionMap, className);
    const { distanceMiles } = this.state;

    return (
      <section className={classes} id="listing-location">
        <Heading as="h2" rootClassName={css.sectionHeadingWithExtraMargin}>
          <FormattedMessage id="ListingPage.locationTitle" />
        </Heading>
        {Number.isFinite(distanceMiles) ? (
          <p className={css.text}>{distanceMiles.toFixed(1)} miles away</p>
        ) : null}
      </section>
    );
  }
}

export default SectionMapMaybe;
