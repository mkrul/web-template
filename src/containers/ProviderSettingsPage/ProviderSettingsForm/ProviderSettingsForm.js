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

import {
  Form,
  PrimaryButton,
  FieldTextInput,
  H4,
  FieldLocationAutocompleteInput,
} from '../../../components';

import css from './ProviderSettingsForm.module.css';
import authCss from '../../AuthenticationPage/AuthenticationPage.module.css';

class ProviderSettingsFormComponent extends Component {
  constructor(props) {
    super(props);
    this.submittedValues = {};
    this.currentUserData = null;
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
          const currentAddress = publicData?.providerAddress;
          const currentApartmentUnit = publicData?.apartmentUnit;

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

          // Debug logging to help troubleshoot apartment unit changes
          if (normalizedNewApartmentUnit !== normalizedCurrentApartmentUnit) {
            console.log('Apartment unit change detected:', {
              current: normalizedCurrentApartmentUnit,
              new: normalizedNewApartmentUnit,
              addressChanged,
              onlyApartmentUnitChanged,
            });
          }

          const classes = classNames(rootClassName || css.root, className);
          const submittedOnce = Object.keys(this.submittedValues).length > 0;

          const pristineSinceLastSubmit =
            submittedOnce && isEqual(values, this.submittedValues);

          // Create conditional validation for address field
          const addressValidation = (value) => {
            // If only apartment unit changed, skip address validation
            if (onlyApartmentUnitChanged) {
              return undefined;
            }

            // Otherwise, apply normal address validation
            const searchRequired = autocompleteSearchRequired(
              addressRequiredMessage
            )(value);
            if (searchRequired) return searchRequired;

            const placeSelected = autocompletePlaceSelected(
              addressNotRecognizedMessage
            )(value);
            return placeSelected;
          };

          // Calculate effective invalid state - ignore address validation errors when only apartment unit changed
          const effectiveInvalid = onlyApartmentUnitChanged ? false : invalid;

          const submitDisabled =
            effectiveInvalid ||
            pristineSinceLastSubmit ||
            inProgress ||
            !addressChanged;

          // Debug logging to see which condition is disabling the submit button
          if (addressChanged && submitDisabled) {
            console.log('Submit button disabled despite address change:', {
              invalid,
              effectiveInvalid,
              pristineSinceLastSubmit,
              inProgress,
              addressChanged,
              onlyApartmentUnitChanged,
              submitDisabled,
              formValues: values,
              currentAddress: currentAddress,
            });
          }

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
              </div>
              <p className={`${authCss.modalHelperText} ${css.disclaimerText}`}>
                <FormattedMessage id="ProviderSettingsForm.providerInfoDescription" />
              </p>

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
