import { senpexEnabled } from '../config/configSenpex';

export const isSenpexAvailable = () => senpexEnabled;

export const formatSenpexDeliveryMethod = (deliveryMethod) => {
  return deliveryMethod === 'senpex-shipping'
    ? 'Senpex Delivery'
    : deliveryMethod;
};

export const getSenpexDeliveryStatusText = (transition) => {
  switch (transition) {
    case 'transition/assign-senpex-delivery':
      return 'Senpex delivery assigned';
    case 'transition/senpex-delivery-in-transit':
      return 'In transit with Senpex';
    case 'transition/senpex-delivery-completed':
      return 'Delivered by Senpex';
    default:
      return null;
  }
};

export const buildSenpexQuoteRequest = ({
  listingId,
  receiverName,
  receiverPhone,
  deliveryAddress,
  deliveryInstructions = '',
  itemValue = 100,
  weightLbs = 10,
  isUrgent = true,
  scheduleDate = null,
}) => {
  return {
    listing_id: listingId,
    order_name: `Order for listing ${listingId}`,
    taken_asap: isUrgent ? 1 : 0,
    schedule_date_local: scheduleDate,
    item_value: itemValue,
    weight_lbs: weightLbs,
    order_desc: deliveryInstructions,
    routes: [
      {
        route_to_text: deliveryAddress,
        rec_name: receiverName,
        rec_phone: receiverPhone,
        route_desc: deliveryInstructions,
      },
    ],
  };
};

export const hasSenpexShipping = (transaction) => {
  const deliveryMethod = transaction?.attributes?.protectedData?.deliveryMethod;
  const hasSenpexQuote =
    !!transaction?.attributes?.protectedData?.senpexQuote?.token;

  // Check if there are line items with Senpex shipping fee
  const lineItems = transaction?.attributes?.lineItems || [];
  const hasSenpexShippingLineItem = lineItems.some(
    (item) => item.code === 'line-item/senpex-shipping-fee'
  );

  // Check if this transaction should have Senpex shipping
  // This includes cases where:
  // 1. deliveryMethod is 'senpex-shipping' (correct value from line items)
  // 2. deliveryMethod is 'senpex' (legacy value)
  // 3. We have Senpex shipping price in protected data
  // 4. We have Senpex quote object (even if token is missing)
  // 5. We have a Senpex shipping fee line item
  // 6. The listing has Senpex shipping enabled
  const listingHasSenpexEnabled =
    transaction?.listing?.attributes?.publicData?.senpexShipping;
  const shouldHaveSenpexShipping =
    deliveryMethod === 'senpex-shipping' ||
    deliveryMethod === 'senpex' ||
    transaction?.attributes?.protectedData?.senpexShippingPriceInSubunits ||
    transaction?.attributes?.protectedData?.senpexQuote ||
    hasSenpexShippingLineItem ||
    listingHasSenpexEnabled;

  const hasToken = shouldHaveSenpexShipping && hasSenpexQuote;

  console.log('hasSenpexShipping check:', {
    transactionId: transaction?.id?.uuid,
    hasProtectedData: !!transaction?.attributes?.protectedData,
    hasSenpexQuote: !!transaction?.attributes?.protectedData?.senpexQuote,
    hasToken,
    tokenValue: transaction?.attributes?.protectedData?.senpexQuote?.token,
    deliveryMethod,
    shouldHaveSenpexShipping,
    hasSenpexShippingLineItem,
    lineItemCodes: lineItems.map((item) => item.code),
    listingHasSenpexEnabled,
    listingPublicDataKeys: transaction?.listing?.attributes?.publicData
      ? Object.keys(transaction.listing.attributes.publicData)
      : [],
  });
  return hasToken;
};

export const getSenpexOrderId = (transaction) => {
  return transaction?.attributes?.protectedData?.senpexOrderId;
};
