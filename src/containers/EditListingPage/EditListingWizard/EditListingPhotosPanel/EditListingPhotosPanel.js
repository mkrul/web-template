import React from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingPhotosForm from './EditListingPhotosForm';
import css from './EditListingPhotosPanel.module.css';

const getInitialValues = (params) => {
  const { images = [] } = params;
  return { images };
};

/**
 * The EditListingPhotosPanel component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {Object} props.errors - The errors object
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {Array} props.images - The images array
 * @param {propTypes.ownListing} props.listing - The listing object
 * @param {Function} props.onImageUpload - The image upload function
 * @param {string} props.submitButtonText - The submit button text
 * @param {boolean} props.panelUpdated - Whether the panel is updated
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {Function} props.onSubmit - The submit function
 * @param {Function} props.onRemoveImage - The remove image function
 * @param {Object} props.listingImageConfig - The listing image config
 * @returns {JSX.Element}
 */
const EditListingPhotosPanel = (props) => {
  const {
    className,
    rootClassName,
    errors,
    disabled,
    ready,
    listing,
    onImageUpload,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    onSubmit,
    onRemoveImage,
    listingImageConfig,
    uploadedImages,
    uploadedImagesOrder,
  } = props;

  // Create a wrapper that immediately saves image removal to server
  const handleRemoveImage = (imageId) => {
    // Update Redux state first
    onRemoveImage(imageId);

    // Get current images from initial values and filter out the removed one
    const currentImages = getInitialValues(props).images || [];
    const filteredImages = currentImages.filter((img) => {
      const imgId = img.imageId || img.id;
      const imgIdString = imgId && imgId.uuid ? imgId.uuid : imgId;
      const removeIdString = imageId && imageId.uuid ? imageId.uuid : imageId;
      return imgIdString !== removeIdString;
    });

    // Immediately submit the updated images list to server (automatic save, no redirect)
    onSubmit({ images: filteredImages }, true);
  };

  // Create a wrapper that automatically saves new uploads to server
  const handleImageUpload = (uploadData, listingImageConfig) => {
    console.log('🔧 [handleImageUpload] Starting upload:', uploadData);

    // First, upload the image (this adds it to Redux state)
    return onImageUpload(uploadData, listingImageConfig).then(
      (uploadedImageData) => {
        console.log(
          '🔧 [handleImageUpload] Upload completed:',
          uploadedImageData
        );

        // After successful upload, immediately submit to attach it to the listing
        // Get current listing images
        const currentImages = getInitialValues(props).images || [];

        // The uploadedImageData is the direct result from the thunk
        const newlyUploadedImage = uploadedImageData;
        console.log(
          '🔧 [handleImageUpload] Newly uploaded image:',
          newlyUploadedImage
        );

        // Include the newly uploaded image with current listing images
        const allImages = currentImages.concat([newlyUploadedImage]);

        console.log('🔧 [handleImageUpload] Submitting to server:', {
          allImagesCount: allImages.length,
          allImages: allImages.map((img) => ({
            id: img.id,
            imageId: img.imageId,
          })),
        });

        // Submit to server to persist the association (automatic save, no redirect)
        return onSubmit({ images: allImages }, true);
      }
    );
  };

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);
  const isPublished =
    listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  return (
    <div className={classes}>
      <H3 as="h1" className={css.heading}>
        {isPublished ? (
          <FormattedMessage
            id="EditListingPhotosPanel.title"
            values={{
              listingTitle: <ListingLink listing={listing} />,
              lineBreak: <br />,
            }}
          />
        ) : (
          <FormattedMessage
            id="EditListingPhotosPanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
      </H3>
      <EditListingPhotosForm
        className={css.form}
        disabled={disabled}
        ready={ready}
        fetchErrors={errors}
        initialValues={getInitialValues(props)}
        onImageUpload={handleImageUpload}
        onSubmit={(values) => {
          const { addImage, ...updateValues } = values;
          onSubmit(updateValues, false);
        }}
        onRemoveImage={handleRemoveImage}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        listingImageConfig={listingImageConfig}
        listing={listing}
      />
    </div>
  );
};

export default EditListingPhotosPanel;
