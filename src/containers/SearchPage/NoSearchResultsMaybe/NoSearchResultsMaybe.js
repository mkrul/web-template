import React from 'react';
import { FormattedMessage } from '../../../util/reactIntl';
import { NamedLink } from '../../../components';

import css from './NoSearchResultsMaybe.module.css';

const NoSearchResultsMaybe = (props) => {
  const { listingsAreLoaded, totalItems, location, resetAll, deliveryAddress } =
    props;
  const hasNoResult = listingsAreLoaded && totalItems === 0;
  const hasSearchParams = location.search?.length > 0;
  const hasDeliveryAddress = !!deliveryAddress;

  if (!listingsAreLoaded || totalItems > 0) {
    return null;
  }

  return (
    <div className={css.noSearchResults}>
      {hasDeliveryAddress ? (
        <FormattedMessage
          id="SearchPage.noResultsWithinRadius"
          values={{ radius: 100 }}
        />
      ) : (
        <FormattedMessage id="SearchPage.noResults" />
      )}
      <br />
      {hasSearchParams ? (
        <button
          className={css.resetAllFiltersButton}
          onClick={(e) => resetAll(e)}
        >
          <FormattedMessage id={'SearchPage.resetAllFilters'} />
        </button>
      ) : null}
      <p>
        <NamedLink className={css.createListingLink} name="NewListingPage">
          <FormattedMessage id="SearchPage.createListing" />
        </NamedLink>
      </p>
    </div>
  );
};

export default NoSearchResultsMaybe;
