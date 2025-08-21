import React, { Component } from 'react';
import { compose } from 'redux';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';

import {
  FormattedMessage,
  injectIntl,
  intlShape,
} from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { ensureCurrentUser } from '../../../util/data';
import {
  autocompleteSearchRequired,
  autocompletePlaceSelected,
  composeValidators,
} from '../../../util/validators';
import * as validators from '../../../util/validators';

import {
  Form,
  PrimaryButton,
  FieldTextInput,
  H4,
  FieldLocationAutocompleteInput,
  FieldPhoneNumberInput,
} from '../../../components';

import css from './ProviderSettingsForm.module.css';
import authCss from '../../AuthenticationPage/AuthenticationPage.module.css';

const PhoneNumberMaybe = (props) => {
  const { formId, userTypeConfig, intl } = props;

  const isDisabled = userTypeConfig?.defaultUserFields?.phoneNumber === false;
  if (isDisabled) {
    return null;
  }

  const { required } = userTypeConfig?.phoneNumberSettings || {};
  const isRequired = required === true;

  const validateMaybe = isRequired
    ? {
        validate: validators.required(
          intl.formatMessage({
            id: 'ProviderSettingsForm.phoneRequired',
          })
        ),
      }
    : {};

  return (
    <FieldPhoneNumberInput
      className={css.phone}
      name="phoneNumber"
      id={formId ? `${formId}.phoneNumber` : 'phoneNumber'}
      label={intl.formatMessage({ id: 'ProviderSettingsForm.phoneLabel' })}
      placeholder={intl.formatMessage({
        id: 'ProviderSettingsForm.phonePlaceholder',
      })}
      {...validateMaybe}
    />
  );
};

class ProviderSettingsFormComponent extends Component {
  constructor(props) {
    super(props);
    this.submittedValues = {};
    this.currentUserData = null;
    this.validationTimeout = null;
  }

  componentWillUnmount() {
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }
  }

  render() {
    return (
      <FinalForm
        {...this.props}
        render={(fieldRenderProps) => {
          const {
            rootClassName,
            className,
            saveProviderSettingsError,
            currentUser,
            formId,
            handleSubmit,
            inProgress = false,
            intl,
            invalid,
            values,
          } = fieldRenderProps;

          const { userTypeConfig } = this.props;

          const user = ensureCurrentUser(currentUser);

          if (!user.id) {
            return null;
          }

          // Store current user data for validation context
          if (!this.currentUserData) {
            this.currentUserData =
              currentUser?.attributes?.profile?.publicData || {};
          }

          const addressRequiredMessage = intl.formatMessage({
            id: 'ProviderSettingsForm.addressRequired',
          });
          const addressNotRecognizedMessage = intl.formatMessage({
            id: 'ProviderSettingsForm.addressNotRecognized',
          });

          const publicData = currentUser?.attributes?.profile?.publicData || {};
          const protectedData =
            currentUser?.attributes?.profile?.protectedData || {};
          const currentAddress = publicData?.providerAddress;
          const currentApartmentUnit = publicData?.apartmentUnit;
          const currentPhoneNumber = protectedData?.phoneNumber;

          // Check if address has changed by comparing the search string
          const currentAddressSearch =
            currentAddress?.search || currentAddress || '';
          const newAddressSearch = values.pub_providerAddress?.search || '';

          // Normalize apartment unit values for comparison (handle null/undefined/empty string)
          const normalizedCurrentApartmentUnit = currentApartmentUnit || '';
          const normalizedNewApartmentUnit = values.apartmentUnit || '';

          const addressChanged =
            newAddressSearch !== currentAddressSearch ||
            normalizedNewApartmentUnit !== normalizedCurrentApartmentUnit;

          // Check if only apartment unit changed (address field unchanged)
          const onlyApartmentUnitChanged =
            newAddressSearch === currentAddressSearch &&
            normalizedNewApartmentUnit !== normalizedCurrentApartmentUnit;

          // Check if phone number has changed
          const phoneNumberChanged =
            currentPhoneNumber !== values.phoneNumber &&
            !(
              typeof currentPhoneNumber === 'undefined' &&
              values.phoneNumber === ''
            );

          const classes = classNames(rootClassName || css.root, className);
          const submittedOnce = Object.keys(this.submittedValues).length > 0;

          const pristineSinceLastSubmit =
            submittedOnce && isEqual(values, this.submittedValues);

          // Create conditional validation for address field
          const addressValidation = (value) => {
            // Clear any existing timeout
            if (this.validationTimeout) {
              clearTimeout(this.validationTimeout);
            }

            // If only apartment unit changed, skip address validation
            if (onlyApartmentUnitChanged) {
              return undefined;
            }

            // If the component is currently fetching predictions or place details,
            // skip validation to prevent premature error messages
            if (
              value &&
              (value.isFetchingPredictions || value.isFetchingPlaceDetails)
            ) {
              return undefined;
            }

            // If this is the initial load with existing data, skip validation
            // to prevent showing errors for valid existing addresses
            if (
              value &&
              value.selectedPlace &&
              value.selectedPlace.address &&
              !value.search
            ) {
              return undefined;
            }

            // If we have a valid selectedPlace, always skip search validation
            // This prevents the "Address is required" error when a place is already selected
            if (value && value.selectedPlace && value.selectedPlace.address) {
              const placeSelected = autocompletePlaceSelected(
                addressNotRecognizedMessage
              )(value);

              return placeSelected;
            }

            // If we have a selectedPlace but no search value, this might be an intermediate state
            // during the address selection process - skip validation to prevent premature errors
            if (value && value.selectedPlace && !value.search) {
              return undefined;
            }

            // If there's a search value but no selectedPlace, and we have predictions,
            // the user is likely in the process of selecting from search results
            // Allow a grace period for the selection to complete
            if (
              value &&
              value.search &&
              !value.selectedPlace &&
              value.predictions &&
              value.predictions.length > 0
            ) {
              return undefined;
            }

            // If there's a search value but no selectedPlace and no predictions,
            // the user might be typing and predictions are being fetched
            // Allow a brief grace period for predictions to load
            if (
              value &&
              value.search &&
              !value.selectedPlace &&
              (!value.predictions || value.predictions.length === 0)
            ) {
              return undefined;
            }

            // If we don't have a selectedPlace, validate that we have a search value
            // This is the case when the user has typed something but hasn't selected from results
            if (!value || !value.search) {
              const searchRequired = autocompleteSearchRequired(
                addressRequiredMessage
              )(value);

              if (searchRequired) {
                return searchRequired;
              }
            }

            // If we have a search value but no selectedPlace, and no predictions,
            // this might be a case where the user typed something but no results were found
            // In this case, we should show the "Please select an address from the suggestions" message
            if (value && value.search && !value.selectedPlace) {
              const placeSelected = autocompletePlaceSelected(
                addressNotRecognizedMessage
              )(value);

              return placeSelected;
            }

            // If we get here, something unexpected happened
            return undefined;
          };

          // Calculate effective invalid state - ignore address validation errors when only apartment unit changed
          const effectiveInvalid = onlyApartmentUnitChanged ? false : invalid;

          const submitDisabled =
            effectiveInvalid ||
            pristineSinceLastSubmit ||
            inProgress ||
            !(addressChanged || phoneNumberChanged);

          let genericError = null;
          if (saveProviderSettingsError) {
            genericError = (
              <span className={css.error}>
                <FormattedMessage id="ProviderSettingsForm.genericFailure" />
              </span>
            );
          }

          return (
            <Form
              className={classes}
              onSubmit={(e) => {
                this.submittedValues = values;
                handleSubmit(e);
              }}
            >
              <p>
                <FormattedMessage id="ProviderSettingsForm.providerInfoDescription" />
              </p>
              <div className={css.providerInfoSection}>
                <div className={css.homeAddressWrapper}>
                  <FieldLocationAutocompleteInput
                    className={css.homeAddress}
                    name="pub_providerAddress"
                    label={intl.formatMessage({
                      id: 'ProviderSettingsForm.homeAddressLabel',
                    })}
                    placeholder={intl.formatMessage({
                      id: 'ProviderSettingsForm.homeAddressPlaceholder',
                    })}
                    validate={addressValidation}
                  />
                </div>

                <FieldTextInput
                  className={css.apartmentUnit}
                  type="text"
                  id="apartmentUnit"
                  name="apartmentUnit"
                  label={intl.formatMessage({
                    id: 'ProviderSettingsForm.apartmentUnitLabel',
                  })}
                  placeholder={intl.formatMessage({
                    id: 'ProviderSettingsForm.apartmentUnitPlaceholder',
                  })}
                />

                <PhoneNumberMaybe
                  formId={formId}
                  userTypeConfig={userTypeConfig}
                  intl={intl}
                />
              </div>

              <p className={`${authCss.modalHelperText} ${css.disclaimerText}`}>
                <FormattedMessage id="ProviderSettingsForm.addressUpdateNotice" />
              </p>

              <div className={css.bottomWrapper}>
                {genericError}
                <PrimaryButton
                  type="submit"
                  inProgress={inProgress}
                  ready={pristineSinceLastSubmit}
                  disabled={submitDisabled}
                >
                  <FormattedMessage id="ProviderSettingsForm.saveChanges" />
                </PrimaryButton>
              </div>
            </Form>
          );
        }}
      />
    );
  }
}

const ProviderSettingsForm = compose(injectIntl)(ProviderSettingsFormComponent);

ProviderSettingsForm.displayName = 'ProviderSettingsForm';

export default ProviderSettingsForm;
