import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

import { H3, ListingLink } from '../../../../components';

import EditListingPolicyForm from './EditListingPolicyForm';
import css from './EditListingPolicyPanel.module.css';

const getInitialValues = (params) => {
  const { publicData } = params;
  const {
    accessibleLocation = [],
    scheduleCompliance = [],
    visibilityCompliance = [],
  } = publicData || {};

  return {
    accessibleLocation,
    scheduleCompliance,
    visibilityCompliance,
  };
};

const EditListingPolicyPanel = (props) => {
  const {
    className,
    rootClassName,
    errors,
    disabled,
    ready,
    listing,
    onSubmit,
    submitButtonText,
    panelUpdated,
    updateInProgress,
  } = props;

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);
  const isPublished =
    listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  return (
    <div className={classes}>
      <H3 as="h1" className={css.heading}>
        {isPublished ? (
          <FormattedMessage
            id="EditListingPolicyPanel.title"
            values={{
              listingTitle: <ListingLink listing={listing} />,
              lineBreak: <br />,
            }}
          />
        ) : (
          <FormattedMessage
            id="EditListingPolicyPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>
      <EditListingPolicyForm
        className={css.form}
        initialValues={getInitialValues(listing?.attributes)}
        onSubmit={(values) => {
          const updateValues = {
            publicData: {
              accessibleLocation: values.accessibleLocation,
              scheduleCompliance: values.scheduleCompliance,
              visibilityCompliance: values.visibilityCompliance,
            },
          };
          onSubmit(updateValues);
        }}
        saveActionMsg={submitButtonText}
        disabled={disabled}
        ready={ready}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        fetchErrors={errors}
      />
    </div>
  );
};

export default EditListingPolicyPanel;
