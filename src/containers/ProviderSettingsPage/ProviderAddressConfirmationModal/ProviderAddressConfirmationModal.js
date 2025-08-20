import React from 'react';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';

import { IconAlert, Modal, Button } from '../../../components';

import css from './ProviderAddressConfirmationModal.module.css';

/**
 * Provider address confirmation modal
 *
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} props.id - The id of the modal
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onCloseModal - The function to close the modal
 * @param {function} props.onManageDisableScrolling - The function to manage disable scrolling
 * @param {function} props.onConfirmUpdate - The function to confirm the address update
 * @param {boolean} props.updateInProgress - Whether the update is in progress
 * @returns {JSX.Element} Provider address confirmation modal component
 */
const ProviderAddressConfirmationModal = props => {
  const intl = useIntl();
  const {
    className,
    rootClassName,
    id,
    isOpen,
    onCloseModal,
    onManageDisableScrolling,
    onConfirmUpdate,
    updateInProgress = false,
  } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <Modal
      id={id}
      containerClassName={classes}
      contentClassName={css.modalContent}
      isOpen={isOpen}
      onClose={onCloseModal}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      closeButtonMessage={intl.formatMessage({ id: 'ProviderAddressConfirmationModal.close' })}
    >
      <IconAlert className={css.modalIcon} />
      <p className={css.modalTitle}>
        <FormattedMessage id="ProviderAddressConfirmationModal.title" />
      </p>
      <p className={css.modalMessage}>
        <FormattedMessage id="ProviderAddressConfirmationModal.message" />
      </p>
      <div className={css.modalButtons}>
        <Button onClick={onCloseModal} className={css.cancelButton}>
          <FormattedMessage id="ProviderAddressConfirmationModal.cancel" />
        </Button>
        <Button onClick={onConfirmUpdate} className={css.confirmButton} inProgress={updateInProgress}>
          <FormattedMessage id="ProviderAddressConfirmationModal.confirm" />
        </Button>
      </div>
    </Modal>
  );
};

export default ProviderAddressConfirmationModal;
