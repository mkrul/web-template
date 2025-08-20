import React from 'react';
import classNames from 'classnames';
import { IconSuccess, IconAlert, IconClose } from '../index';

import css from './Notification.module.css';

const Notification = (props) => {
  const {
    className,
    rootClassName,
    type = 'info',
    message,
    onClose,
    showCloseButton = true,
    children,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const typeClasses = classNames(css[type], css.notification);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <IconSuccess className={css.icon} />;
      case 'error':
      case 'warning':
        return <IconAlert className={css.icon} />;
      default:
        return null;
    }
  };

  return (
    <div className={typeClasses}>
      <div className={css.content}>
        {getIcon()}
        <div className={css.message}>{message || children}</div>
        {showCloseButton && onClose && (
          <button className={css.closeButton} onClick={onClose} type="button">
            <IconClose className={css.closeIcon} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Notification;
