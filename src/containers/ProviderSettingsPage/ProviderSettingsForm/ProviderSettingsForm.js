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
          const addressChanged =
            newAddressSearch !== currentAddressSearch ||
            values.apartmentUnit !== currentApartmentUnit;

          const classes = classNames(rootClassName || css.root, className);
          const submittedOnce = Object.keys(this.submittedValues).length > 0;

          const pristineSinceLastSubmit =
            submittedOnce && isEqual(values, this.submittedValues);

          const submitDisabled =
            invalid || pristineSinceLastSubmit || inProgress || !addressChanged;

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
                    validate={composeValidators(
                      autocompleteSearchRequired(addressRequiredMessage),
                      autocompletePlaceSelected(addressNotRecognizedMessage)
                    )}
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
