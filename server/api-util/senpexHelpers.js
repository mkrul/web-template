const TRANSPORT_TYPES = {
  CAR: 1,
  SUV: 3,
  PICKUP_TRUCK: 8,
  LARGE_VAN: 9,
  REF_VAN_9FT: 4,
  BOX_TRUCK_10FT: 2,
  BOX_TRUCK_15FT: 5,
  BOX_TRUCK_17FT: 6,
};

const PACKAGE_SIZES = {
  SMALL: 1, // 1-25 lbs
  MEDIUM: 2, // 26-50 lbs
  LARGE: 3, // 51-70 lbs
  HEAVY: 4, // 71-150 lbs
};

const getTransportTypeForWeight = (weightLbs) => {
  if (weightLbs <= 70) return TRANSPORT_TYPES.CAR;
  if (weightLbs <= 150) return TRANSPORT_TYPES.SUV;
  return TRANSPORT_TYPES.PICKUP_TRUCK;
};

const getPackageSizeForWeight = (weightLbs) => {
  if (weightLbs <= 25) return PACKAGE_SIZES.SMALL;
  if (weightLbs <= 50) return PACKAGE_SIZES.MEDIUM;
  if (weightLbs <= 70) return PACKAGE_SIZES.LARGE;
  return PACKAGE_SIZES.HEAVY;
};

const buildSenpexQuoteRequest = ({
  orderName,
  isUrgent = true,
  scheduleDate = null,
  itemValue,
  weightLbs = 10,
  email,
  orderDescription = '',
  routes = [],
  promoCode = '',
}) => {
  return {
    order_name: orderName,
    taken_asap: isUrgent ? 1 : 0,
    schedule_date_local: scheduleDate,
    transport_id: getTransportTypeForWeight(weightLbs),
    item_value: itemValue,
    pack_size_id: getPackageSizeForWeight(weightLbs),
    promo_code: promoCode,
    order_desc: orderDescription,
    routes: routes.map((route) => ({
      route_to_text: route.address,
      rec_name: route.receiverName || '',
      rec_phone: route.receiverPhone || '',
      route_desc: route.description || '',
    })),
  };
};

const parseSenpexQuoteResponse = (response) => {
  if (!response.details || !response.details[0]) {
    throw new Error('Invalid Senpex quote response');
  }

  const quote = response.details[0];
  return {
    token: quote.api_token,
    tokenHash: quote.token_hash,
    price: parseFloat(quote.order_price),
    originalPrice: parseFloat(quote.original_order_price),
    discount: quote.order_discount ? parseFloat(quote.order_discount) : null,
    distanceMiles: parseFloat(quote.distance_miles),
    estimatedTimeSeconds: parseInt(quote.distance_time_seconds),
    scheduleDate: quote.schedule_date,
    expiresInMinutes: quote.expire_mins,
  };
};

module.exports = {
  TRANSPORT_TYPES,
  PACKAGE_SIZES,
  getTransportTypeForWeight,
  getPackageSizeForWeight,
  buildSenpexQuoteRequest,
  parseSenpexQuoteResponse,
};
