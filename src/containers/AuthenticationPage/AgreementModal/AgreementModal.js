import React, { useState } from 'react';
import classNames from 'classnames';
import { Form as FinalForm } from 'react-final-form';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { required } from '../../../util/validators';

import { FieldCheckbox, Form, Modal, PrimaryButton } from '../../../components';

import css from './AgreementModal.module.css';

const AgreementForm = (props) => (
  <FinalForm
    {...props}
    render={(fieldRenderProps) => {
      const {
        className,
        rootClassName,
        disabled,
        handleSubmit,
        intl,
        formId,
        invalid,
        onAcceptInProgress,
        onAcceptError,
      } = fieldRenderProps;

      const errorMessageMaybe = onAcceptError ? (
        <FormattedMessage id="AgreementModal.acceptFailed" />
      ) : null;

      const classes = classNames(rootClassName || css.formRoot, className);
      const submitInProgress = onAcceptInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <FieldCheckbox
            className={css.agreementCheckbox}
            id={formId ? `${formId}.agreement` : 'agreement'}
            name="agreement"
            label={intl.formatMessage({ id: 'AgreementModal.checkboxLabel' })}
            validate={required(
              intl.formatMessage({ id: 'AgreementModal.agreementRequired' })
            )}
          />
          <p className={css.errorPlaceholder}>{errorMessageMaybe}</p>
          <PrimaryButton
            className={css.submitButton}
            type="submit"
            inProgress={onAcceptInProgress}
            disabled={submitDisabled}
          >
            {intl.formatMessage({ id: 'AgreementModal.createAccountButton' })}
          </PrimaryButton>
        </Form>
      );
    }}
  />
);

/**
 * Agreement modal for Terms of Service acceptance during signup
 *
 * Phase 1.2 Component Structure:
 * - Accept props: isOpen, onClose, onAccept, onManageDisableScrolling, tosContent, userInfo
 * - Render scrollable ToS content passed as tosContent prop
 * - Include FieldCheckbox for agreement
 * - Include PrimaryButton for account creation
 * - Handle form validation (button disabled until checkbox checked)
 *
 * @component
 * @param {Object} props - The props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} props.id - The id
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - The on close modal function
 * @param {Function} props.onManageDisableScrolling - The on manage disable scrolling function
 * @param {Function} props.onAccept - The on accept function
 * @param {ReactNode} props.tosContent - The rendered terms of service content
 * @param {Object} props.userInfo - The user signup information
 * @param {boolean} props.onAcceptInProgress - Whether the accept is in progress
 * @param {propTypes.error} props.onAcceptError - The accept error
 * @returns {JSX.Element} The AgreementModal component
 */
const AgreementModal = (props) => {
  const intl = useIntl();
  const {
    className,
    rootClassName,
    id,
    isOpen = false,
    onClose,
    onManageDisableScrolling,
    onAccept,
    tosContent,
    userInfo,
    onAcceptInProgress = false,
    onAcceptError,
  } = props;

  const classes = classNames(rootClassName || css.root, className);

  const handleSubmit = (values) => {
    if (values.agreement && onAccept) {
      onAccept(userInfo);
    }
  };

  return (
    <Modal
      id={id}
      containerClassName={classes}
      contentClassName={css.modalContent}
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      closeButtonMessage={intl.formatMessage({ id: 'AgreementModal.close' })}
    >
      <div className={css.modalBody}>
        <p className={css.modalTitle}>
          <FormattedMessage id="AgreementModal.title" />
        </p>

        <div className={css.tosContent}>{tosContent}</div>

        <AgreementForm
          onSubmit={handleSubmit}
          onAcceptInProgress={onAcceptInProgress}
          onAcceptError={onAcceptError}
          intl={intl}
        />
      </div>
    </Modal>
  );
};

// PropTypes removed temporarily to resolve initialization issue
// TODO: Re-add PropTypes once module loading issue is resolved

export default AgreementModal;
