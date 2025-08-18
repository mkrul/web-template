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
  const hasToken = !!transaction?.attributes?.protectedData?.senpexQuote?.token;
  console.log('hasSenpexShipping check:', {
    transactionId: transaction?.id?.uuid,
    hasProtectedData: !!transaction?.attributes?.protectedData,
    hasSenpexQuote: !!transaction?.attributes?.protectedData?.senpexQuote,
    hasToken,
    tokenValue: transaction?.attributes?.protectedData?.senpexQuote?.token,
    deliveryMethod: transaction?.attributes?.protectedData?.deliveryMethod,
  });
  return hasToken;
};

export const getSenpexOrderId = (transaction) => {
  return transaction?.attributes?.protectedData?.senpexOrderId;
};
