import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { intlShape } from '../../util/reactIntl';
import {
  Form,
  FieldTextInput,
  PrimaryButton,
  IconSpinner,
} from '../../components';
import { propTypes as sdkPropTypes } from '../../util/types';

const SenpexShippingForm = ({
  listing,
  orderData,
  onSubmit,
  disabled,
  onGetQuote,
  quoteInProgress,
  quote,
  intl,
}) => {
  const [formValues, setFormValues] = useState({
    receiverName: '',
    receiverPhone: '',
    deliveryAddress: '',
    deliveryInstructions: '',
  });

  const handleFieldChange = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGetQuote = () => {
    if (onGetQuote) {
      const pickupAddress =
        listing?.author?.attributes?.profile?.publicData?.deliveryAddress ||
        listing?.attributes?.publicData?.location?.address ||
        null;
      onGetQuote({
        ...formValues,
        listingId: listing.id,
        pickupAddress: pickupAddress || undefined,
        ...orderData,
      });
    }
  };

  const handleSubmit = (values) => {
    if (onSubmit) {
      onSubmit({
        ...values,
        senpexQuote: quote,
      });
    }
  };

  const isFormValid =
    formValues.receiverName &&
    formValues.receiverPhone &&
    formValues.deliveryAddress;

  return (
    <div className="SenpexShippingForm">
      <h3>
        <FormattedMessage
          id="SenpexShippingForm.title"
          defaultMessage="Senpex Delivery Details"
        />
      </h3>

      <Form onSubmit={handleSubmit} disabled={disabled}>
        <FieldTextInput
          id="receiverName"
          name="receiverName"
          type="text"
          label={
            <FormattedMessage
              id="SenpexShippingForm.receiverNameLabel"
              defaultMessage="Receiver name"
            />
          }
          onChange={(value) => handleFieldChange('receiverName', value)}
          required
        />

        <FieldTextInput
          id="receiverPhone"
          name="receiverPhone"
          type="tel"
          label={
            <FormattedMessage
              id="SenpexShippingForm.receiverPhoneLabel"
              defaultMessage="Receiver phone"
            />
          }
          onChange={(value) => handleFieldChange('receiverPhone', value)}
          required
        />

        <FieldTextInput
          id="deliveryAddress"
          name="deliveryAddress"
          type="text"
          label={
            <FormattedMessage
              id="SenpexShippingForm.deliveryAddressLabel"
              defaultMessage="Delivery address"
            />
          }
          onChange={(value) => handleFieldChange('deliveryAddress', value)}
          required
        />

        <FieldTextInput
          id="deliveryInstructions"
          name="deliveryInstructions"
          type="textarea"
          label={
            <FormattedMessage
              id="SenpexShippingForm.deliveryInstructionsLabel"
              defaultMessage="Delivery instructions (optional)"
            />
          }
          onChange={(value) => handleFieldChange('deliveryInstructions', value)}
        />

        <PrimaryButton
          type="button"
          onClick={handleGetQuote}
          disabled={!isFormValid || quoteInProgress}
          inProgress={quoteInProgress}
        >
          {quoteInProgress ? (
            <IconSpinner />
          ) : (
            <FormattedMessage
              id="SenpexShippingForm.getQuoteButton"
              defaultMessage="Get shipping quote"
            />
          )}
        </PrimaryButton>

        {quote && (
          <div className="SenpexQuoteDisplay">
            <h4>
              <FormattedMessage
                id="SenpexShippingForm.quoteTitle"
                defaultMessage="Shipping Quote"
              />
            </h4>
            <p>
              <FormattedMessage
                id="SenpexShippingForm.quotePrice"
                defaultMessage="Price: {price}"
                values={{ price: quote.price }}
              />
            </p>
            <p>
              <FormattedMessage
                id="SenpexShippingForm.quoteDistance"
                defaultMessage="Distance: {distance} miles"
                values={{ distance: quote.distanceMiles }}
              />
            </p>
          </div>
        )}
      </Form>
    </div>
  );
};

SenpexShippingForm.propTypes = {
  listing: sdkPropTypes.listing.isRequired,
  orderData: PropTypes.object,
  onSubmit: PropTypes.func,
  disabled: PropTypes.bool,
  onGetQuote: PropTypes.func,
  quoteInProgress: PropTypes.bool,
  quote: PropTypes.object,
  intl: intlShape.isRequired,
};

export default SenpexShippingForm;
