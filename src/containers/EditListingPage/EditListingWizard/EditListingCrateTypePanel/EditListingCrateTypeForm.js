import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';
import { required } from '../../../../util/validators';

// Import shared components
import { Button, Form, FieldRadioButton } from '../../../../components';

import css from './EditListingCrateTypeForm.module.css';

const EditListingCrateTypeForm = (props) => {
  const {
    className,
    disabled,
    ready,
    saveActionMsg,
    updated,
    updateInProgress,
    fetchErrors,
    onSubmit,
  } = props;

  const intl = useIntl();

  return (
    <FinalForm
      {...props}
      render={(formRenderProps) => {
        const {
          className,
          disabled,
          ready,
          handleSubmit,
          invalid,
          pristine,
          saveActionMsg,
          updated,
          updateInProgress,
          fetchErrors,
          values,
        } = formRenderProps;

        const submitReady = (updated && pristine) || ready;
        const submitInProgress = updateInProgress;
        const submitDisabled = invalid || disabled || submitInProgress;
        const { updateListingError, showListingsError } = fetchErrors || {};

        const classes = classNames(css.root, className);

        return (
          <Form className={classes} onSubmit={handleSubmit}>
            {updateListingError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingCrateTypeForm.updateFailed" />
              </p>
            ) : null}

            {showListingsError ? (
              <p className={css.error}>
                <FormattedMessage id="EditListingCrateTypeForm.showListingFailed" />
              </p>
            ) : null}

            <div className={css.formGroup}>
              <p className={css.description}>
                <FormattedMessage id="EditListingCrateTypeForm.description" />
              </p>

              <FieldRadioButton
                id="wire"
                name="crateType"
                label={intl.formatMessage({
                  id: 'EditListingCrateTypeForm.wireLabel',
                })}
                value="wire"
                validate={required(
                  intl.formatMessage({
                    id: 'EditListingCrateTypeForm.crateTypeRequired',
                  })
                )}
              />

              <div className={css.wireDescription}>
                <ul className={css.descriptionList}>
                  <li>
                    <FormattedMessage id="EditListingCrateTypeForm.wireDescription" />
                  </li>
                </ul>
              </div>

              <FieldRadioButton
                id="solid"
                name="crateType"
                label={intl.formatMessage({
                  id: 'EditListingCrateTypeForm.solidLabel',
                })}
                value="solid"
                validate={required(
                  intl.formatMessage({
                    id: 'EditListingCrateTypeForm.crateTypeRequired',
                  })
                )}
              />

              <div className={css.solidDescription}>
                <ul className={css.descriptionList}>
                  <li>
                    <FormattedMessage id="EditListingCrateTypeForm.solidDescription" />
                  </li>
                </ul>
              </div>
            </div>

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

export default EditListingCrateTypeForm;
