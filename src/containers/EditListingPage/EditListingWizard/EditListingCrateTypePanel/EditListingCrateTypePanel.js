import React from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingCrateTypeForm from './EditListingCrateTypeForm';
import css from './EditListingCrateTypePanel.module.css';

const getInitialValues = (params) => {
  const { publicData = {} } = params;
  return { crateType: publicData.crateType || '' };
};

const EditListingCrateTypePanel = (props) => {
  const {
    className,
    rootClassName,
    errors,
    disabled,
    ready,
    listing,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    onSubmit,
    onRemoveImage,
  } = props;

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);
  const isPublished =
    listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  const handleCrateTypeChange = (values) => {
    const currentCrateType = listing?.attributes?.publicData?.crateType;
    const newCrateType = values.crateType;

    console.log('🔧 [CrateTypePanel] handleCrateTypeChange called');
    console.log('🔧 [CrateTypePanel] Current crate type:', currentCrateType);
    console.log('🔧 [CrateTypePanel] New crate type:', newCrateType);
    console.log(
      '🔧 [CrateTypePanel] onRemoveImage function:',
      typeof onRemoveImage
    );
    console.log('🔧 [CrateTypePanel] Listing images:', listing?.images);
    console.log('🔧 [CrateTypePanel] Images count:', listing?.images?.length);

    // Check if crate type is actually changing
    if (currentCrateType && currentCrateType !== newCrateType) {
      console.log('🔧 [CrateTypePanel] Crate type is changing!');
      const currentImages = listing?.images || [];
      console.log('🔧 [CrateTypePanel] Current images:', currentImages);

      // Clear ALL images when crate type changes
      if (currentImages.length > 0) {
        console.log(
          '🔧 [CrateTypePanel] Clearing all',
          currentImages.length,
          'images'
        );
        currentImages.forEach((image, index) => {
          console.log(
            '🔧 [CrateTypePanel] Removing image:',
            image.id,
            'at index:',
            index
          );
          onRemoveImage(image.id);
        });
      } else {
        console.log('🔧 [CrateTypePanel] No images to remove');
      }
    } else {
      console.log(
        '🔧 [CrateTypePanel] Crate type is not changing or no previous type'
      );
    }

    const updateValues = { publicData: { crateType: values.crateType } };
    console.log('🔧 [CrateTypePanel] Submitting update values:', updateValues);
    onSubmit(updateValues);
  };

  return (
    <div className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingCrateTypePanel.title"
            values={{
              listingTitle: <ListingLink listing={listing} />,
              lineBreak: <br />,
            }}
          />
        ) : (
          <FormattedMessage
            id="EditListingCrateTypePanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>
      <EditListingCrateTypeForm
        className={css.form}
        disabled={disabled}
        ready={ready}
        fetchErrors={errors}
        initialValues={getInitialValues(listing.attributes)}
        onSubmit={handleCrateTypeChange}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
      />
    </div>
  );
};

export default EditListingCrateTypePanel;
