import React from 'react';
import { useSelector } from 'react-redux';
import { array, bool, node, object, string, func } from 'prop-types';
import classNames from 'classnames';
import _ from 'lodash';
import { propTypes } from '../../../util/types';
import { ListingCard, PaginationLinks } from '../../../components';
import { getBookingDeliveryAddress } from '../../../selectors/searchResultsSelectors';

import css from './SearchResultsPanel.module.css';

const SearchResultsPanel = props => {
  const {
    className,
    rootClassName,
    listings,
    pagination,
    search,
    setActiveListing,
    isMapVariant,
    setDeliveryAddress,
  } = props;
  const classes = classNames(rootClassName || css.root, className);

  // check if the deliveryAddress state has changed
  const deliveryAddress = useSelector(getBookingDeliveryAddress);
  const searchAddressIsPresent = !_.isNull(search?.address) && !_.isUndefined(search?.address);

  console.log('deliveryAddress', deliveryAddress)
  console.log('search.?address', search?.address)

  // if the deliveryAddress state has changed, set the delivery address
  if (searchAddressIsPresent && search.address !== deliveryAddress) {
    setDeliveryAddress(search.address);
  }

  const paginationLinks =
    pagination && pagination.totalPages > 1 ? (
      <PaginationLinks
        className={css.pagination}
        pageName="SearchPage"
        pageSearchParams={search}
        pagination={pagination}
      />
    ) : null;

  const cardRenderSizes = isMapVariant => {
    if (isMapVariant) {
      // Panel width relative to the viewport
      const panelMediumWidth = 50;
      const panelLargeWidth = 62.5;
      return [
        '(max-width: 767px) 100vw',
        `(max-width: 1023px) ${panelMediumWidth}vw`,
        `(max-width: 1920px) ${panelLargeWidth / 2}vw`,
        `${panelLargeWidth / 3}vw`,
      ].join(', ');
    } else {
      // Panel width relative to the viewport
      const panelMediumWidth = 50;
      const panelLargeWidth = 62.5;
      return [
        '(max-width: 549px) 100vw',
        '(max-width: 767px) 50vw',
        `(max-width: 1439px) 26vw`,
        `(max-width: 1920px) 18vw`,
        `14vw`,
      ].join(', ');
    }
  };

  return (
    <div className={classes}>
      <div className={isMapVariant ? css.listingCardsMapVariant : css.listingCards}>
        {listings.map(l => (
          <ListingCard
            className={css.listingCard}
            key={l.id.uuid}
            listing={l}
            renderSizes={cardRenderSizes(isMapVariant)}
            setActiveListing={setActiveListing}
          />
        ))}
        {props.children}
      </div>
      {paginationLinks}
    </div>
  );
};

SearchResultsPanel.defaultProps = {
  children: null,
  className: null,
  listings: [],
  pagination: null,
  rootClassName: null,
  search: null,
  isMapVariant: true,
  setDeliveryAddress: null,
};

SearchResultsPanel.propTypes = {
  children: node,
  className: string,
  listings: array,
  pagination: propTypes.pagination,
  rootClassName: string,
  search: object,
  isMapVariant: bool,
  setDeliveryAddress: func,
};

export default SearchResultsPanel;
