import React from 'react';
import classNames from 'classnames';
import { Field } from 'react-final-form';
import css from './FieldCircleCheckbox.module.css';

const FieldCircleCheckbox = (props) => {
  const { id, name, label, className, rootClassName, ...rest } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <Field name={name} type="checkbox">
      {({ input }) => (
        <label className={classes} htmlFor={id}>
          <span className={css.inputWrapper}>
            <input
              {...input}
              {...rest}
              id={id}
              className={css.input}
              type="checkbox"
            />
            <span
              className={classNames(css.circle, input.checked && css.checked)}
            >
              {input.checked && (
                <svg
                  className={css.checkmark}
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                >
                  <polyline
                    points="4,9 7,12 12,5"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </span>
          <span className={css.labelText}>{label}</span>
        </label>
      )}
    </Field>
  );
};

export default FieldCircleCheckbox;
