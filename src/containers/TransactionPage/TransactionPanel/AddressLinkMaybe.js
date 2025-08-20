import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { ExternalLink } from '../../../components';
import { generateExternalMapUrl } from '../../../util/maps';
import { mapProvider } from '../../../config/configMaps';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build AddressLinkMaybe
const AddressLinkMaybe = (props) => {
  const {
    className,
    rootClassName,
    linkRootClassName,
    location,
    geolocation,
    showAddress,
  } = props;
  const { address, building } = location || {};
  const hrefToExternalMap = generateExternalMapUrl({
    address,
    geolocation,
    mapProvider,
  });

  const fullAddress =
    typeof building === 'string' && building.length > 0
      ? `${building}, ${address}`
      : address;

  const classes = classNames(rootClassName || css.address, className);
  return showAddress && hrefToExternalMap && (address || building) ? (
    <p className={classes}>
      {fullAddress} <br />
      <span className={css.viewOnGoogleMapsWrapper}>
        <ExternalLink className={linkRootClassName} href={hrefToExternalMap}>
          <FormattedMessage id="AddressLinkMaybe.viewOnMap" />
        </ExternalLink>
      </span>
    </p>
  ) : null;
};

export default AddressLinkMaybe;
