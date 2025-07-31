import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Form, PrimaryButton, FieldBoolean } from '../../../../components';

const SenpexShippingForm = ({
  disabled,
  onSubmit,
  onChange,
  saveActionMsg,
  updated,
  updateInProgress,
  intl,
  senpexEnabled,
}) => {
  const [enableSenpex, setEnableSenpex] = useState(false);

  const handleSubmit = (values) => {
    const { senpexShipping = false } = values;
    const updateValues = {
      senpexShipping,
    };
    onSubmit(updateValues);
  };

  const handleSenpexToggle = (value) => {
    setEnableSenpex(value);
    if (onChange) {
      onChange({ senpexShipping: value });
    }
  };

  if (!senpexEnabled) {
    return null;
  }

  return (
    <Form
      className="EditListingDeliveryForm"
      onSubmit={handleSubmit}
      disabled={disabled || updateInProgress}
      updated={updated}
      updateInProgress={updateInProgress}
    >
      <FieldBoolean
        id="senpexShipping"
        name="senpexShipping"
        label={
          <FormattedMessage
            id="EditListingDeliveryForm.senpexShippingLabel"
            defaultMessage="Enable Senpex delivery"
          />
        }
        onChange={handleSenpexToggle}
      />

      <PrimaryButton
        type="submit"
        inProgress={updateInProgress}
        disabled={disabled || updateInProgress}
      >
        {saveActionMsg}
      </PrimaryButton>
    </Form>
  );
};

export default SenpexShippingForm;
