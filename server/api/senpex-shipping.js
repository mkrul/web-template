const { handleError } = require('../api-util/sdk');
const {
  buildSenpexQuoteRequest,
  parseSenpexQuoteResponse,
} = require('../api-util/senpexHelpers');

const senpexRequest = async (method, path, options = {}) => {
  const { headers = {}, body, ...otherOptions } = options;
  const url = `${process.env.SENPEX_API_BASE_URL}${path}`;

  console.log('=== Senpex API Request ===');
  console.log('Method:', method);
  console.log('URL:', url);
  console.log('Headers:', {
    clientid: process.env.SENPEX_CLIENT_ID ? '***SET***' : '***MISSING***',
    secretid: process.env.SENPEX_SECRET_ID ? '***SET***' : '***MISSING***',
    'Content-Type': 'application/json',
    ...headers,
  });
  console.log('Body:', body);
  console.log('Other options:', otherOptions);

  try {
    // Remove request logging
  } catch (_) {}
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

  console.log('=== Senpex API Response ===');
  console.log('Status:', res.status);
  console.log('Status Text:', res.statusText);
  console.log('Headers:', Object.fromEntries(res.headers.entries()));

  if (!res.ok) {
    const text = await res.text();
    console.log('Error Response Body:', text);
    const err = new Error(`Senpex request failed: ${res.status}`);
    err.status = res.status;
    err.statusText = res.statusText;
    err.data = { body: text };
    throw err;
  }
  try {
    // Remove ok logging
  } catch (_) {}
  const responseData = await res.json();
  console.log('Success Response Body:', responseData);
  console.log('==============================');
  return responseData;
};

module.exports = (router) => {
  router.post('/shipping/senpex/quote', async (req, res) => {
    const { body } = req;

    console.log('=== Senpex Pickup Quote Request ===');
    console.log('Request body:', body);

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

      console.log('Built API body:', apiBody);

      const response = await senpexRequest('POST', '/orders/pickup/quote', {
        body: apiBody,
      });

      const normalized = parseSenpexQuoteResponse(response);
      console.log('Normalized response:', normalized);
      console.log('==============================');

      res.status(200).json(normalized);
    } catch (error) {
      console.log('Senpex pickup quote error:', error);
      console.log('==============================');
      handleError(res, error);
    }
  });

  router.put('/shipping/senpex/confirm', async (req, res) => {
    const { body } = req;

    console.log('=== Senpex Pickup Confirm Request ===');
    console.log('Request body:', body);

    try {
      const response = await senpexRequest('PUT', '/orders/pickup', { body });
      console.log('Confirm response:', response);
      console.log('==============================');
      res.status(200).json(response);
    } catch (error) {
      console.log('Senpex pickup confirm error:', error);
      console.log('==============================');
      handleError(res, error);
    }
  });

  router.post('/shipping/senpex/dropoff/quote', async (req, res) => {
    const { body } = req;

    console.log('=== Senpex Dropoff Quote Request ===');
    console.log('Request body:', body);

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

      console.log('Built API body:', apiBody);

      const response = await senpexRequest('POST', '/orders/dropoff/quote', {
        body: apiBody,
      });

      const normalized = parseSenpexQuoteResponse(response);
      console.log('Normalized response:', normalized);
      console.log('==============================');

      res.status(200).json(normalized);
    } catch (error) {
      console.log('Senpex dropoff quote error:', error);
      console.log('==============================');
      handleError(res, error);
    }
  });

  router.put('/shipping/senpex/dropoff/confirm', async (req, res) => {
    const { body } = req;

    console.log('=== Senpex Dropoff Confirm Request ===');
    console.log('Request body:', body);

    try {
      const response = await senpexRequest('PUT', '/orders/dropoff', { body });
      console.log('Confirm response:', response);
      console.log('==============================');
      res.status(200).json(response);
    } catch (error) {
      console.log('Senpex dropoff confirm error:', error);
      console.log('==============================');
      handleError(res, error);
    }
  });
};
