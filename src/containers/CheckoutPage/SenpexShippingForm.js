import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { intlShape } from '../../util/reactIntl';
import { PrimaryButton, IconSpinner } from '../../components';
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
  currentUser,
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

      <div className="SenpexForm">
        <div className="formField">
          <label htmlFor="receiverName">
            <FormattedMessage
              id="SenpexShippingForm.receiverNameLabel"
              defaultMessage="Receiver name"
            />
          </label>
          <input
            id="receiverName"
            name="receiverName"
            type="text"
            value={formValues.receiverName}
            onChange={(e) => handleFieldChange('receiverName', e.target.value)}
            required
            disabled={disabled}
          />
        </div>

        <div className="formField">
          <label htmlFor="receiverPhone">
            <FormattedMessage
              id="SenpexShippingForm.receiverPhoneLabel"
              defaultMessage="Receiver phone"
            />
          </label>
          <input
            id="receiverPhone"
            name="receiverPhone"
            type="tel"
            value={formValues.receiverPhone}
            onChange={(e) => handleFieldChange('receiverPhone', e.target.value)}
            required
            disabled={disabled}
          />
        </div>

        <div className="formField">
          <label htmlFor="deliveryAddress">
            <FormattedMessage
              id="SenpexShippingForm.deliveryAddressLabel"
              defaultMessage="Delivery address"
            />
          </label>
          <input
            id="deliveryAddress"
            name="deliveryAddress"
            type="text"
            value={formValues.deliveryAddress}
            onChange={(e) =>
              handleFieldChange('deliveryAddress', e.target.value)
            }
            required
            disabled={disabled}
          />
        </div>

        <div className="formField">
          <label htmlFor="deliveryInstructions">
            <FormattedMessage
              id="SenpexShippingForm.deliveryInstructionsLabel"
              defaultMessage="Delivery instructions (optional)"
            />
          </label>
          <textarea
            id="deliveryInstructions"
            name="deliveryInstructions"
            value={formValues.deliveryInstructions}
            onChange={(e) =>
              handleFieldChange('deliveryInstructions', e.target.value)
            }
            disabled={disabled}
          />
        </div>

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
      </div>
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
