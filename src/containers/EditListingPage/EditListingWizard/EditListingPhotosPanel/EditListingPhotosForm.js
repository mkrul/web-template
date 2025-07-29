import React, { useState } from 'react';
import { ARRAY_ERROR } from 'final-form';
import { Form as FinalForm, Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import {
  nonEmptyArray,
  composeValidators,
  requiredPhotos,
} from '../../../../util/validators';
import { isUploadImageOverLimitError } from '../../../../util/errors';

// Import shared components
import { Button, Form, AspectRatioWrapper } from '../../../../components';

// Import modules from this directory
import ListingImage from './ListingImage';
import css from './EditListingPhotosForm.module.css';

const ACCEPT_IMAGES = 'image/*';

const ImageUploadError = (props) => {
  return props.uploadOverLimit ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadOverLimit" />
    </p>
  ) : props.uploadImageError ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.imageUploadFailed.uploadFailed" />
    </p>
  ) : null;
};

// NOTE: PublishListingError and ShowListingsError are here since Photos panel is the last visible panel
// before creating a new listing. If that order is changed, these should be changed too.
// Create and show listing errors are shown above submit button
const PublishListingError = (props) => {
  return props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.publishListingFailed" />
    </p>
  ) : null;
};

const ShowListingsError = (props) => {
  return props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingPhotosForm.showListingFailed" />
    </p>
  ) : null;
};

// Field component that uses file-input to allow user to select images.
export const FieldAddImage = (props) => {
  const {
    formApi,
    onImageUploadHandler,
    aspectWidth = 1,
    aspectHeight = 1,
    ...rest
  } = props;
  return (
    <Field form={null} {...rest}>
      {(fieldprops) => {
        const { accept, input, label, disabled: fieldDisabled } = fieldprops;
        const { name, type } = input;
        const onChange = (e) => {
          const file = e.target.files[0];
          formApi.change(`addImage`, file);
          formApi.blur(`addImage`);
          onImageUploadHandler(file);
        };
        const inputProps = { accept, id: name, name, onChange, type };
        return (
          <div className={css.addImageWrapper}>
            <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
              {fieldDisabled ? null : (
                <input {...inputProps} className={css.addImageInput} />
              )}
              <label htmlFor={name} className={css.addImage}>
                {label}
              </label>
            </AspectRatioWrapper>
          </div>
        );
      }}
    </Field>
  );
};

// Component that shows listing images from "images" field array
const FieldListingImage = (props) => {
  const {
    name,
    intl,
    onRemoveImage,
    aspectWidth,
    aspectHeight,
    variantPrefix,
  } = props;
  return (
    <Field name={name}>
      {(fieldProps) => {
        const { input } = fieldProps;
        const image = input.value;
        return image ? (
          <ListingImage
            image={image}
            key={image?.id?.uuid || image?.id}
            className={css.thumbnail}
            savedImageAltText={intl.formatMessage({
              id: 'EditListingPhotosForm.savedImageAltText',
            })}
            onRemoveImage={() => onRemoveImage(image?.id)}
            aspectWidth={aspectWidth}
            aspectHeight={aspectHeight}
            variantPrefix={variantPrefix}
          />
        ) : null;
      }}
    </Field>
  );
};

/**
 * The EditListingPhotosForm component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {boolean} props.ready - Whether the form is ready
 * @param {boolean} props.updated - Whether the form is updated
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @param {Object} props.fetchErrors - The fetch errors object
 * @param {propTypes.error} props.fetchErrors.publishListingError - The publish listing error
 * @param {propTypes.error} props.fetchErrors.showListingsError - The show listings error
 * @param {propTypes.error} props.fetchErrors.uploadImageError - The upload image error
 * @param {propTypes.error} props.fetchErrors.updateListingError - The update listing error
 * @param {string} props.saveActionMsg - The save action message
 * @param {Function} props.onSubmit - The submit function
 * @param {Function} props.onImageUpload - The image upload function
 * @param {Function} props.onRemoveImage - The remove image function
 * @param {Object} props.listingImageConfig - The listing image config
 * @param {number} props.listingImageConfig.aspectWidth - The aspect width
 * @param {number} props.listingImageConfig.aspectHeight - The aspect height
 * @param {string} props.listingImageConfig.variantPrefix - The variant prefix
 * @param {propTypes.ownListing} props.listing - The listing object
 * @returns {JSX.Element}
 */
export const EditListingPhotosForm = (props) => {
  const [state, setState] = useState({ imageUploadRequested: false });
  const [submittedImages, setSubmittedImages] = useState([]);

  const onImageUploadHandler = (file) => {
    const { listingImageConfig, onImageUpload } = props;
    if (file) {
      setState({ imageUploadRequested: true });

      onImageUpload(
        { id: `${file.name}_${Date.now()}`, file },
        listingImageConfig
      )
        .then(() => {
          setState({ imageUploadRequested: false });
        })
        .catch(() => {
          setState({ imageUploadRequested: false });
        });
    }
  };
  const intl = useIntl();

  return (
    <FinalForm
      {...props}
      enableReinitialize={true}
      mutators={{ ...arrayMutators }}
      render={(formRenderProps) => {
        const {
          form,
          className,
          fetchErrors,
          handleSubmit,
          invalid,
          onRemoveImage,
          disabled,
          ready,
          saveActionMsg,
          updated,
          updateInProgress,
          touched,
          errors,
          values,
          listingImageConfig,
          listing,
        } = formRenderProps;

        const images = values.images || [];
        const { aspectWidth, aspectHeight, variantPrefix } = listingImageConfig;

        const {
          publishListingError,
          showListingsError,
          updateListingError,
          uploadImageError,
        } = fetchErrors || {};
        const uploadOverLimit = isUploadImageOverLimitError(uploadImageError);

        // imgs can contain added images (with temp ids) and submitted images with uniq ids.
        const arrayOfImgIds = (imgs) =>
          imgs?.map((i) => (typeof i.id === 'string' ? i.imageId : i.id));
        const imageIdsFromProps = arrayOfImgIds(images);
        const imageIdsFromPreviousSubmit = arrayOfImgIds(submittedImages);
        const imageArrayHasSameImages = isEqual(
          imageIdsFromProps,
          imageIdsFromPreviousSubmit
        );
        const submittedOnce = submittedImages.length > 0;
        const pristineSinceLastSubmit =
          submittedOnce && imageArrayHasSameImages;

        // Get the listing's category to determine photo requirements
        const listingCategory =
          values.categoryLevel1 ||
          listing?.attributes?.publicData?.categoryLevel1;

        // Check if photos meet minimum requirements based on crate category
        const hasMinimumPhotos = () => {
          if (!images || images.length === 0) {
            return false;
          }

          // Different photo requirements based on crate category
          let minPhotos;
          if (listingCategory === 'wire-crate-id') {
            minPhotos = 3;
          } else if (listingCategory === 'solid-crate-id') {
            minPhotos = 6;
          } else {
            // Default fallback for other categories
            minPhotos = 1;
          }

          return images.length >= minPhotos;
        };

        const submitReady = (updated && pristineSinceLastSubmit) || ready;
        const submitInProgress = updateInProgress;
        const submitDisabled =
          invalid ||
          disabled ||
          submitInProgress ||
          state.imageUploadRequested ||
          !hasMinimumPhotos();
        const imagesError =
          touched.images && errors?.images && errors.images[ARRAY_ERROR];

        const classes = classNames(css.root, className);

        return (
          <Form
            className={classes}
            onSubmit={(e) => {
              setSubmittedImages(images);
              handleSubmit(e);
            }}
          >
            {updateListingError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingPhotosForm.updateFailed" />
              </p>
            ) : null}

            <p className={css.tip}>
              <FormattedMessage
                id={
                  listingCategory === 'wire-crate-id'
                    ? 'EditListingPhotosForm.wireImagesTip'
                    : listingCategory === 'solid-crate-id'
                      ? 'EditListingPhotosForm.solidImagesTip'
                      : 'EditListingPhotosForm.addImagesTip'
                }
              />
            </p>

            <div className={css.imagesFieldArray}>
              <FieldArray
                name="images"
                validate={composeValidators(
                  requiredPhotos(
                    intl.formatMessage({
                      id:
                        listingCategory === 'wire-crate-id'
                          ? 'EditListingPhotosForm.wirePhotosRequired'
                          : listingCategory === 'solid-crate-id'
                            ? 'EditListingPhotosForm.solidPhotosRequired'
                            : 'EditListingPhotosForm.photosRequired',
                    }),
                    listingCategory
                  )
                )}
              >
                {({ fields }) =>
                  fields.map((name, index) => (
                    <FieldListingImage
                      key={name}
                      name={name}
                      onRemoveImage={(imageId) => {
                        fields.remove(index);
                        onRemoveImage(imageId);
                      }}
                      intl={intl}
                      aspectWidth={aspectWidth}
                      aspectHeight={aspectHeight}
                      variantPrefix={variantPrefix}
                    />
                  ))
                }
              </FieldArray>

              <FieldAddImage
                id="addImage"
                name="addImage"
                accept={ACCEPT_IMAGES}
                label={
                  <span className={css.chooseImageText}>
                    <span className={css.chooseImage}>
                      <FormattedMessage id="EditListingPhotosForm.chooseImage" />
                    </span>
                    <span className={css.imageTypes}>
                      <FormattedMessage id="EditListingPhotosForm.imageTypes" />
                    </span>
                  </span>
                }
                type="file"
                disabled={state.imageUploadRequested}
                formApi={form}
                onImageUploadHandler={onImageUploadHandler}
                aspectWidth={aspectWidth}
                aspectHeight={aspectHeight}
              />
            </div>

            {imagesError ? (
              <div className={css.arrayError}>{imagesError}</div>
            ) : null}

            <ImageUploadError
              uploadOverLimit={uploadOverLimit}
              uploadImageError={uploadImageError}
            />

            <PublishListingError error={publishListingError} />
            <ShowListingsError error={showListingsError} />

            <Button
              className={css.submitButton}
              type="submit"
              inProgress={submitInProgress}
              disabled={submitDisabled}
              ready={submitReady}
            >
              {saveActionMsg}
            </Button>
          </Form>
        );
      }}
    />
  );
};

export default EditListingPhotosForm;
