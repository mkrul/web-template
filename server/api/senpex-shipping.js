const { handleError } = require('../api-util/sdk');
const {
  buildSenpexQuoteRequest,
  parseSenpexQuoteResponse,
  buildSenpexOrderDataFromTransaction,
} = require('../api-util/senpexHelpers');

const senpexRequest = async (method, path, options = {}) => {
  const { headers = {}, body, ...otherOptions } = options;
  const url = `${process.env.SENPEX_API_BASE_URL}${path}`;

  const res = await globalThis.fetch(url, {
    method,
    headers: {
      clientid: process.env.SENPEX_CLIENT_ID,
      secretid: process.env.SENPEX_SECRET_ID,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...otherOptions,
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Senpex request failed: ${res.status}`);
    err.status = res.status;
    err.statusText = res.statusText;
    err.data = { body: text };
    throw err;
  }
  const responseData = await res.json();
  return responseData;
};

module.exports = (router) => {
  router.post('/shipping/senpex/quote', async (req, res) => {
    const { body } = req;

    try {
      const apiBody = buildSenpexQuoteRequest({
        orderName:
          body.orderName ||
          `Order for listing ${body?.listingId?.uuid || body?.listingId || ''}`,
        isUrgent: true,
        scheduleDate: null,
        itemValue: body.itemValue || 100,
        weightLbs: body.weightLbs || 10,
        orderDescription: body.deliveryInstructions || '',
        routes: [
          {
            address: body.deliveryAddress,
            receiverName: body.receiverName,
            receiverPhone: body.receiverPhone,
            description: body.deliveryInstructions || '',
          },
        ],
      });

      const response = await senpexRequest('POST', '/orders/pickup/quote', {
        body: apiBody,
      });

      const normalized = parseSenpexQuoteResponse(response);
      res.status(200).json(normalized);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.put('/shipping/senpex/confirm', async (req, res) => {
    const { body } = req;

    try {
      console.log('Senpex order creation API call would be made with data:', {
        endpoint: 'PUT /orders/pickup',
        requestBody: body,
        timestamp: new Date().toISOString(),
      });

      const response = await senpexRequest('PUT', '/orders/pickup', { body });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.post('/shipping/senpex/dropoff/quote', async (req, res) => {
    const { body } = req;

    try {
      const apiBody = buildSenpexQuoteRequest({
        orderName:
          body.orderName ||
          `Order for listing ${body?.listingId?.uuid || body?.listingId || ''}`,
        isUrgent: true,
        scheduleDate: null,
        itemValue: body.itemValue || 100,
        weightLbs: body.weightLbs || 10,
        orderDescription: body.deliveryInstructions || '',
        routes: [
          {
            pickupAddress: body.pickupAddress,
            address: body.deliveryAddress,
            receiverName: body.receiverName,
            receiverPhone: body.receiverPhone,
            description: body.deliveryInstructions || '',
          },
        ],
      });

      const response = await senpexRequest('POST', '/orders/dropoff/quote', {
        body: apiBody,
      });

      const normalized = parseSenpexQuoteResponse(response);
      res.status(200).json(normalized);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.put('/shipping/senpex/dropoff/confirm', async (req, res) => {
    const { body } = req;

    try {
      console.log('Senpex order creation API call would be made with data:', {
        endpoint: 'PUT /orders/dropoff',
        requestBody: body,
        timestamp: new Date().toISOString(),
      });

      const response = await senpexRequest('PUT', '/orders/dropoff', { body });
      res.status(200).json(response);
    } catch (error) {
      handleError(res, error);
    }
  });

  router.post('/shipping/senpex/log-booking-accepted', async (req, res) => {
    const { transaction } = req.body;

    try {
      console.log('Senpex order creation logging for booking acceptance:', {
        transactionId: transaction?.id?.uuid,
        processName: transaction?.attributes?.processName,
        lastTransition: transaction?.attributes?.lastTransition,
        timestamp: new Date().toISOString(),
      });

      // Build Senpex order data from transaction
      const senpexOrderData = buildSenpexOrderDataFromTransaction(transaction);

      console.log('Senpex order creation would be triggered with data:', {
        endpoint: 'PUT /orders/pickup',
        orderData: senpexOrderData,
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({
        message: 'Senpex order creation logged successfully',
        orderData: senpexOrderData,
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  router.post(
    '/shipping/senpex/create-order-from-booking',
    async (req, res) => {
      const { transaction } = req.body;

      try {
        console.log('Creating actual Senpex order for booking acceptance:', {
          transactionId: transaction?.id?.uuid,
          processName: transaction?.attributes?.processName,
          lastTransition: transaction?.attributes?.lastTransition,
          hasProtectedData: !!transaction?.attributes?.protectedData,
          protectedDataKeys: transaction?.attributes?.protectedData
            ? Object.keys(transaction.attributes.protectedData)
            : [],
          deliveryMethod:
            transaction?.attributes?.protectedData?.deliveryMethod,
          hasSenpexQuote: !!transaction?.attributes?.protectedData?.senpexQuote,
          senpexQuoteKeys: transaction?.attributes?.protectedData?.senpexQuote
            ? Object.keys(transaction.attributes.protectedData.senpexQuote)
            : [],
          senpexQuoteToken:
            transaction?.attributes?.protectedData?.senpexQuote?.token,
          timestamp: new Date().toISOString(),
        });

        // Build Senpex order data from transaction
        const senpexOrderData =
          buildSenpexOrderDataFromTransaction(transaction);

        console.log('Making actual Senpex order creation API call:', {
          endpoint: 'PUT /orders/pickup',
          orderData: senpexOrderData,
          timestamp: new Date().toISOString(),
        });

        // Make the actual API call to Senpex
        const senpexResponse = await senpexRequest('PUT', '/orders/pickup', {
          body: senpexOrderData,
        });

        console.log('Senpex order created successfully:', {
          orderId: senpexResponse.inserted_id,
          distance: senpexResponse.distance,
          distanceTime: senpexResponse.distance_time,
          transactionId: transaction?.id?.uuid,
          timestamp: new Date().toISOString(),
        });

        // TODO: Consider storing Senpex order ID back to transaction protected data
        // This would require making an SDK call to update the transaction
        // For now, we return the order details so the client can store them if needed

        res.status(200).json({
          message: 'Senpex order created successfully',
          senpexOrderId: senpexResponse.inserted_id,
          distance: senpexResponse.distance,
          distanceTime: senpexResponse.distance_time,
          senpexResponse,
          orderData: senpexOrderData,
          transactionId: transaction?.id?.uuid,
        });
      } catch (error) {
        console.error('Senpex order creation failed:', error);
        handleError(res, error);
      }
    }
  );
};
