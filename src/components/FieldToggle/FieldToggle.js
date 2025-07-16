import React from 'react';
import classNames from 'classnames';
import { Field } from 'react-final-form';

import css from './FieldToggle.module.css';

const FieldToggle = (props) => {
  const { rootClassName, className, id, label, useSuccessColor, ...rest } =
    props;

  const classes = classNames(rootClassName || css.root, className);

  const handleOnChange = (input, event) => {
    const { onBlur, onChange } = input;
    onChange(event);
    onBlur(event);

    if (rest.onChange) {
      rest.onChange(event);
    }
  };

  const successColorVariantMaybe = useSuccessColor
    ? {
        className: css.toggleSuccess,
      }
    : {};

  return (
    <span className={classes}>
      <Field type="checkbox" {...rest}>
        {(props) => {
          const { input, disabled } = props;
          return (
            <input
              id={id}
              className={css.input}
              {...input}
              onChange={(event) => handleOnChange(input, event)}
              disabled={disabled}
            />
          );
        }}
      </Field>
      <label htmlFor={id} className={css.label}>
        <span className={css.toggleWrapper}>
          <div
            className={classNames(
              css.toggle,
              successColorVariantMaybe.className
            )}
          >
            <div className={css.toggleTrack} />
            <div className={css.toggleThumb} />
          </div>
        </span>
        <span className={css.text}>{label}</span>
      </label>
    </span>
  );
};

export default FieldToggle;
