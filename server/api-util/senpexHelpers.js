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
  const firstRoute = routes[0] || {};
  return {
    order_name: orderName,
    taken_asap: isUrgent ? 1 : 0,
    schedule_date_local: scheduleDate,
    transport_id: getTransportTypeForWeight(weightLbs),
    item_value: itemValue,
    pack_size_id: getPackageSizeForWeight(weightLbs),
    promo_code: promoCode,
    order_desc: orderDescription,
    // Compatibility top-level fields some Senpex endpoints accept
    ...(firstRoute.pickupAddress
      ? { pack_from_text: firstRoute.pickupAddress }
      : {}),
    ...(firstRoute.address ? { pack_to_text: firstRoute.address } : {}),
    routes: routes.map((route) => ({
      route_from_text: route.pickupAddress,
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

const buildSenpexOrderDataFromTransaction = (transaction) => {
  console.log('Building Senpex order data from transaction:', {
    transactionId: transaction?.id?.uuid,
    processName: transaction?.attributes?.processName,
    lastTransition: transaction?.attributes?.lastTransition,
    hasProtectedData: !!transaction?.attributes?.protectedData,
    protectedDataKeys: transaction?.attributes?.protectedData
      ? Object.keys(transaction.attributes.protectedData)
      : [],
    deliveryMethod: transaction?.attributes?.protectedData?.deliveryMethod,
    hasSenpexQuote: !!transaction?.attributes?.protectedData?.senpexQuote,
    senpexQuoteKeys: transaction?.attributes?.protectedData?.senpexQuote
      ? Object.keys(transaction.attributes.protectedData.senpexQuote)
      : [],
    senpexQuoteToken:
      transaction?.attributes?.protectedData?.senpexQuote?.token,
    customer: transaction?.customer?.attributes,
    provider: transaction?.provider?.attributes,
    listing: transaction?.listing?.attributes,
    booking: transaction?.booking?.attributes,
  });

  // Extract relevant data from transaction
  const customer = transaction?.customer?.attributes;
  const provider = transaction?.provider?.attributes;
  const listing = transaction?.listing?.attributes;
  const booking = transaction?.booking?.attributes;
  const protectedData = transaction?.attributes?.protectedData;

  // Extract Senpex quote data that should have been stored during checkout
  const senpexQuote = protectedData?.senpexQuote;

  if (!senpexQuote?.token) {
    console.warn(
      'No Senpex quote token found in transaction protected data. This transaction may not have used Senpex shipping.'
    );
    throw new Error(
      'No Senpex quote token found in transaction protected data. Quote must be created first during checkout.'
    );
  }

  // Validate token hasn't expired (tokens expire in 60 minutes)
  const tokenCreatedAt = senpexQuote.createdAt
    ? new Date(senpexQuote.createdAt)
    : null;
  const now = new Date();
  const tokenAgeMinutes = tokenCreatedAt
    ? (now - tokenCreatedAt) / (1000 * 60)
    : null;

  if (tokenAgeMinutes && tokenAgeMinutes > 55) {
    console.warn(
      `Senpex token is ${Math.round(tokenAgeMinutes)} minutes old and may have expired (60min limit)`
    );
  }

  // Build order data structure for Senpex API
  const orderData = {
    email: customer?.email || provider?.email,
    api_token: senpexQuote.token,
    tip_amount: 0,
    sender_name: provider?.profile?.displayName || provider?.profile?.firstName,
    sender_cell: provider?.profile?.protectedData?.phoneNumber,
    sender_desc: `Order for listing: ${listing?.title || 'Unknown listing'}`,
    order_desc:
      protectedData?.deliveryInstructions ||
      booking?.attributes?.description ||
      '',
    routes: [
      {
        rec_name:
          customer?.profile?.displayName || customer?.profile?.firstName,
        rec_phone: customer?.profile?.protectedData?.phoneNumber,
        address: protectedData?.deliveryAddress || customer?.profile?.address,
        description: protectedData?.deliveryInstructions || '',
      },
    ],
    snpx_user_email: 1,
    snpx_order_email: 1,
    snpx_order_not: 1,
    search_courier: 1,
  };

  console.log('Generated Senpex order data:', orderData);
  return orderData;
};

module.exports = {
  TRANSPORT_TYPES,
  PACKAGE_SIZES,
  getTransportTypeForWeight,
  getPackageSizeForWeight,
  buildSenpexQuoteRequest,
  parseSenpexQuoteResponse,
  buildSenpexOrderDataFromTransaction,
};
