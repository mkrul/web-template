import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';
import { bool, func, object, string } from 'prop-types';

import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';

import {
  Form,
  PrimaryButton,
  FieldCircleCheckbox,
} from '../../../../components';

import css from './EditListingPolicyForm.module.css';

const formValidate = (values) => {
  const errors = {};
  if (
    !values.accessibleLocation ||
    !values.scheduleCompliance ||
    !values.visibilityCompliance
  ) {
    errors._policy = 'All policy terms must be accepted.';
  }
  return errors;
};

const EditListingPolicyFormComponent = (props) => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    validate={formValidate}
    render={(formRenderProps) => {
      const {
        className,
        disabled,
        ready,
        handleSubmit,
        intl,
        invalid,
        pristine,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        values,
        errors,
        submitFailed,
      } = formRenderProps;

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      const { updateListingError, showListingsError } = fetchErrors || {};

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          {updateListingError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPolicyForm.updateFailed" />
            </p>
          ) : null}

          {showListingsError ? (
            <p className={css.error}>
              <FormattedMessage id="EditListingPolicyForm.showListingFailed" />
            </p>
          ) : null}

          <div className={css.formGroup}>
            <p className={css.description}>
              <FormattedMessage id="EditListingPolicyForm.description" />
            </p>

            <FieldCircleCheckbox
              name="accessibleLocation"
              id="accessibleLocation"
              label={intl.formatMessage({
                id: 'EditListingPolicyForm.accessibleLocationLabel',
              })}
            />

            <FieldCircleCheckbox
              name="scheduleCompliance"
              id="scheduleCompliance"
              label={intl.formatMessage({
                id: 'EditListingPolicyForm.scheduleComplianceLabel',
              })}
            />

            <FieldCircleCheckbox
              name="visibilityCompliance"
              id="visibilityCompliance"
              label={intl.formatMessage({
                id: 'EditListingPolicyForm.visibilityComplianceLabel',
              })}
            />

            {submitFailed && errors && errors._policy ? (
              <div className={css.error}>
                <FormattedMessage
                  id="EditListingPolicyForm.allRequired"
                  defaultMessage="All policy terms must be accepted."
                />
              </div>
            ) : null}
          </div>

          <PrimaryButton
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </PrimaryButton>
        </Form>
      );
    }}
  />
);

const EditListingPolicyForm = (props) => {
  const intl = useIntl();
  return <EditListingPolicyFormComponent {...props} intl={intl} />;
};

EditListingPolicyForm.defaultProps = {
  saveActionMsg: 'Save policy',
  updateInProgress: false,
  fetchErrors: null,
};

EditListingPolicyForm.propTypes = {
  onSubmit: func.isRequired,
  saveActionMsg: string,
  disabled: bool,
  ready: bool,
  updated: bool,
  updateInProgress: bool,
  fetchErrors: object,
};

export default EditListingPolicyForm;
